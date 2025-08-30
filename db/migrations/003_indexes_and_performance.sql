-- ===================================================================
-- MIGRATION: 003_indexes_and_performance.sql
-- Description: Advanced indexes, performance optimizations, and database functions
-- Author: Database Architect Agent
-- Date: 2025-08-30
-- Dependencies: 002_seed_categories.sql
-- ===================================================================

BEGIN;

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '003_indexes_and_performance') THEN
        RAISE NOTICE 'Migration 003_indexes_and_performance already applied, skipping...';
        ROLLBACK;
    END IF;
END $$;

-- ===================================================================
-- ADVANCED PERFORMANCE INDEXES
-- ===================================================================

-- Categories advanced indexes
CREATE INDEX IF NOT EXISTS idx_categories_updated ON categories(updated_at);
CREATE INDEX IF NOT EXISTS idx_categories_name_lower ON categories(LOWER(name));

-- Passages advanced performance indexes
CREATE INDEX IF NOT EXISTS idx_passages_reading_level ON passages(reading_level);
CREATE INDEX IF NOT EXISTS idx_passages_source_year ON passages(source_year) WHERE source_year IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_passages_updated ON passages(updated_at);
CREATE INDEX IF NOT EXISTS idx_passages_composite_query ON passages(category_id, source_type, verified, rand_key);
CREATE INDEX IF NOT EXISTS idx_passages_text_search ON passages USING GIN (to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_passages_style_tags ON passages USING GIN (style_tags);
CREATE INDEX IF NOT EXISTS idx_passages_generator_model ON passages(generator_model) WHERE generator_model IS NOT NULL;

-- Users advanced indexes  
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Game sessions advanced indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_started ON game_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_ended ON game_sessions(ended_at) WHERE ended_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(user_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_streak ON game_sessions(streak DESC);

-- Guesses advanced indexes
CREATE INDEX IF NOT EXISTS idx_guesses_created ON guesses(created_at);
CREATE INDEX IF NOT EXISTS idx_guesses_correctness ON guesses(is_correct);
CREATE INDEX IF NOT EXISTS idx_guesses_performance ON guesses(user_id, created_at, is_correct);
CREATE INDEX IF NOT EXISTS idx_guesses_time_analysis ON guesses(time_ms, is_correct);
CREATE INDEX IF NOT EXISTS idx_guesses_passage_stats ON guesses(passage_id, is_correct);

-- User stats advanced indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_last_played ON user_stats(last_played_at) WHERE last_played_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_stats_accuracy ON user_stats((correct::DECIMAL/NULLIF(total_questions,0))) WHERE total_questions > 0;
CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_stats(streak_best DESC);

-- ===================================================================
-- ADVANCED DATABASE FUNCTIONS
-- ===================================================================

-- Function to get random passages for quiz with advanced filtering
CREATE OR REPLACE FUNCTION get_random_passages(
    p_category_ids INT[] DEFAULT NULL,
    p_limit INT DEFAULT 1,
    p_exclude_passage_ids BIGINT[] DEFAULT NULL,
    p_verified_only BOOLEAN DEFAULT true,
    p_min_reading_level INT DEFAULT 1,
    p_max_reading_level INT DEFAULT 5,
    p_source_type source_type DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    text TEXT,
    category_id INT,
    source_type source_type,
    reading_level INT,
    category_name TEXT,
    category_domain TEXT,
    style_tags TEXT[],
    rand_key DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.text,
        p.category_id,
        p.source_type,
        p.reading_level,
        c.name as category_name,
        c.domain as category_domain,
        p.style_tags,
        p.rand_key
    FROM passages p
    JOIN categories c ON p.category_id = c.id
    WHERE 
        (p_category_ids IS NULL OR p.category_id = ANY(p_category_ids))
        AND (p_exclude_passage_ids IS NULL OR NOT (p.id = ANY(p_exclude_passage_ids)))
        AND (NOT p_verified_only OR p.verified = true)
        AND (p_source_type IS NULL OR p.source_type = p_source_type)
        AND p.reading_level >= p_min_reading_level
        AND p.reading_level <= p_max_reading_level
        AND c.is_active = true
    ORDER BY p.rand_key
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update user statistics with transaction safety
CREATE OR REPLACE FUNCTION update_user_stats(
    p_user_id UUID,
    p_questions_answered INT,
    p_correct_answers INT,
    p_current_streak INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_stats (
        user_id, 
        games_played, 
        total_questions, 
        correct, 
        streak_best,
        last_played_at
    ) VALUES (
        p_user_id, 
        1, 
        p_questions_answered, 
        p_correct_answers, 
        p_current_streak,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        games_played = user_stats.games_played + 1,
        total_questions = user_stats.total_questions + p_questions_answered,
        correct = user_stats.correct + p_correct_answers,
        streak_best = GREATEST(user_stats.streak_best, p_current_streak),
        last_played_at = NOW();
        
    -- Update last_played_at for the user
    UPDATE users SET created_at = created_at WHERE id = p_user_id; -- Touch record for cache invalidation
END;
$$ LANGUAGE plpgsql;

-- Function to get comprehensive user performance analytics
CREATE OR REPLACE FUNCTION get_user_performance(p_user_id UUID)
RETURNS TABLE (
    total_games INT,
    total_questions INT,
    total_correct INT,
    accuracy DECIMAL(5,2),
    best_streak INT,
    avg_response_time_ms DECIMAL(8,2),
    median_response_time_ms DECIMAL(8,2),
    last_played TIMESTAMPTZ,
    favorite_category TEXT,
    hardest_category TEXT,
    recent_trend TEXT
) AS $$
DECLARE
    recent_accuracy DECIMAL(5,2);
    older_accuracy DECIMAL(5,2);
BEGIN
    RETURN QUERY
    WITH user_performance AS (
        SELECT 
            COALESCE(us.games_played, 0) as games,
            COALESCE(us.total_questions, 0) as questions,
            COALESCE(us.correct, 0) as correct_ans,
            CASE 
                WHEN COALESCE(us.total_questions, 0) = 0 THEN 0.00
                ELSE ROUND((COALESCE(us.correct, 0)::DECIMAL / us.total_questions) * 100, 2)
            END as acc,
            COALESCE(us.streak_best, 0) as streak,
            us.last_played_at,
            COALESCE(AVG(g.time_ms), 0) as avg_time,
            COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY g.time_ms), 0) as med_time
        FROM user_stats us
        LEFT JOIN guesses g ON g.user_id = us.user_id
        WHERE us.user_id = p_user_id
        GROUP BY us.user_id, us.games_played, us.total_questions, us.correct, us.streak_best, us.last_played_at
    ),
    category_performance AS (
        SELECT 
            c.name as cat_name,
            COUNT(g.id) as guess_count,
            AVG(CASE WHEN g.is_correct THEN 1.0 ELSE 0.0 END) as cat_accuracy
        FROM guesses g
        JOIN passages p ON g.passage_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE g.user_id = p_user_id
        GROUP BY c.id, c.name
        HAVING COUNT(g.id) >= 3 -- Only categories with at least 3 guesses
    ),
    best_category AS (
        SELECT cat_name FROM category_performance ORDER BY cat_accuracy DESC, guess_count DESC LIMIT 1
    ),
    worst_category AS (
        SELECT cat_name FROM category_performance ORDER BY cat_accuracy ASC, guess_count DESC LIMIT 1
    ),
    recent_performance AS (
        SELECT 
            AVG(CASE WHEN g.is_correct THEN 1.0 ELSE 0.0 END) as recent_acc
        FROM guesses g
        WHERE g.user_id = p_user_id 
        AND g.created_at >= NOW() - INTERVAL '7 days'
    ),
    older_performance AS (
        SELECT 
            AVG(CASE WHEN g.is_correct THEN 1.0 ELSE 0.0 END) as older_acc
        FROM guesses g
        WHERE g.user_id = p_user_id 
        AND g.created_at < NOW() - INTERVAL '7 days'
        AND g.created_at >= NOW() - INTERVAL '30 days'
    )
    SELECT 
        up.games::INT,
        up.questions::INT,
        up.correct_ans::INT,
        up.acc,
        up.streak::INT,
        up.avg_time,
        up.med_time,
        up.last_played_at,
        COALESCE(bc.cat_name, 'N/A') as fav_cat,
        COALESCE(wc.cat_name, 'N/A') as hard_cat,
        CASE 
            WHEN rp.recent_acc IS NULL OR op.older_acc IS NULL THEN 'Insufficient data'
            WHEN rp.recent_acc > op.older_acc + 0.1 THEN 'Improving'
            WHEN rp.recent_acc < op.older_acc - 0.1 THEN 'Declining' 
            ELSE 'Stable'
        END as trend
    FROM user_performance up
    LEFT JOIN best_category bc ON true
    LEFT JOIN worst_category wc ON true
    LEFT JOIN recent_performance rp ON true
    LEFT JOIN older_performance op ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to get category performance statistics
CREATE OR REPLACE FUNCTION get_category_performance()
RETURNS TABLE (
    category_id INT,
    category_name TEXT,
    domain TEXT,
    total_passages INT,
    verified_passages INT,
    total_guesses INT,
    correct_guesses INT,
    accuracy DECIMAL(5,2),
    avg_response_time_ms DECIMAL(8,2),
    difficulty_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        c.domain,
        COUNT(DISTINCT p.id)::INT as total_passages,
        COUNT(DISTINCT CASE WHEN p.verified THEN p.id END)::INT as verified_passages,
        COUNT(g.id)::INT as total_guesses,
        COUNT(CASE WHEN g.is_correct THEN 1 END)::INT as correct_guesses,
        CASE 
            WHEN COUNT(g.id) = 0 THEN 0.00
            ELSE ROUND((COUNT(CASE WHEN g.is_correct THEN 1 END)::DECIMAL / COUNT(g.id)) * 100, 2)
        END as accuracy,
        COALESCE(AVG(g.time_ms), 0.00) as avg_response_time_ms,
        CASE 
            WHEN COUNT(g.id) = 0 THEN 50.00 -- Default moderate difficulty
            ELSE 100.00 - ROUND((COUNT(CASE WHEN g.is_correct THEN 1 END)::DECIMAL / COUNT(g.id)) * 100, 2)
        END as difficulty_score
    FROM categories c
    LEFT JOIN passages p ON p.category_id = c.id
    LEFT JOIN guesses g ON g.passage_id = p.id
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.domain
    ORDER BY c.sort_order, c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get passage difficulty analytics
CREATE OR REPLACE FUNCTION get_passage_difficulty(p_passage_id BIGINT)
RETURNS TABLE (
    passage_id BIGINT,
    total_guesses INT,
    correct_guesses INT,
    accuracy DECIMAL(5,2),
    avg_response_time_ms DECIMAL(8,2),
    difficulty_rating TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_passage_id,
        COUNT(g.id)::INT as total_guesses,
        COUNT(CASE WHEN g.is_correct THEN 1 END)::INT as correct_guesses,
        CASE 
            WHEN COUNT(g.id) = 0 THEN NULL::DECIMAL(5,2)
            ELSE ROUND((COUNT(CASE WHEN g.is_correct THEN 1 END)::DECIMAL / COUNT(g.id)) * 100, 2)
        END as accuracy,
        AVG(g.time_ms) as avg_response_time_ms,
        CASE 
            WHEN COUNT(g.id) < 5 THEN 'Insufficient data'
            WHEN ROUND((COUNT(CASE WHEN g.is_correct THEN 1 END)::DECIMAL / COUNT(g.id)) * 100, 2) >= 80 THEN 'Easy'
            WHEN ROUND((COUNT(CASE WHEN g.is_correct THEN 1 END)::DECIMAL / COUNT(g.id)) * 100, 2) >= 60 THEN 'Moderate'
            WHEN ROUND((COUNT(CASE WHEN g.is_correct THEN 1 END)::DECIMAL / COUNT(g.id)) * 100, 2) >= 40 THEN 'Hard'
            ELSE 'Very Hard'
        END as difficulty_rating
    FROM guesses g
    WHERE g.passage_id = p_passage_id
    GROUP BY p_passage_id;
END;
$$ LANGUAGE plpgsql;

-- Function for leaderboard generation
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_limit INT DEFAULT 10,
    p_time_period INTERVAL DEFAULT '30 days'::INTERVAL
)
RETURNS TABLE (
    rank BIGINT,
    user_id UUID,
    user_handle TEXT,
    total_games INT,
    total_questions INT,
    accuracy DECIMAL(5,2),
    best_streak INT,
    avg_response_time_ms DECIMAL(8,2),
    recent_games INT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_metrics AS (
        SELECT 
            u.id,
            u.handle,
            us.games_played,
            us.total_questions,
            CASE 
                WHEN us.total_questions = 0 THEN 0.00
                ELSE ROUND((us.correct::DECIMAL / us.total_questions) * 100, 2)
            END as accuracy,
            us.streak_best,
            COALESCE(AVG(g.time_ms), 0) as avg_time,
            COUNT(DISTINCT gs.id) as recent_game_count
        FROM users u
        JOIN user_stats us ON u.id = us.user_id
        LEFT JOIN guesses g ON g.user_id = u.id
        LEFT JOIN game_sessions gs ON gs.user_id = u.id AND gs.started_at >= NOW() - p_time_period
        WHERE us.total_questions >= 10 -- Minimum questions for ranking
        GROUP BY u.id, u.handle, us.games_played, us.total_questions, us.correct, us.streak_best
    )
    SELECT 
        ROW_NUMBER() OVER (
            ORDER BY 
                um.accuracy DESC,
                um.total_questions DESC,
                um.best_streak DESC,
                um.avg_time ASC
        ) as rank,
        um.id as user_id,
        COALESCE(um.handle, 'Anonymous') as user_handle,
        um.games_played as total_games,
        um.total_questions,
        um.accuracy,
        um.best_streak,
        um.avg_time as avg_response_time_ms,
        um.recent_game_count as recent_games
    FROM user_metrics um
    ORDER BY rank
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- PERFORMANCE ANALYSIS VIEWS
-- ===================================================================

-- Materialized view for category analytics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_analytics AS
SELECT 
    c.id,
    c.name,
    c.domain,
    COUNT(DISTINCT p.id) as total_passages,
    COUNT(DISTINCT CASE WHEN p.verified THEN p.id END) as verified_passages,
    COUNT(g.id) as total_guesses,
    AVG(CASE WHEN g.is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
    AVG(g.time_ms) as avg_response_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY g.time_ms) as median_response_time
FROM categories c
LEFT JOIN passages p ON p.category_id = c.id
LEFT JOIN guesses g ON g.passage_id = p.id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.domain;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_category_analytics_id ON mv_category_analytics(id);
CREATE INDEX IF NOT EXISTS idx_mv_category_analytics_domain ON mv_category_analytics(domain);
CREATE INDEX IF NOT EXISTS idx_mv_category_analytics_accuracy ON mv_category_analytics(accuracy DESC);

-- ===================================================================
-- DATABASE MAINTENANCE FUNCTIONS
-- ===================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_analytics;
    RAISE NOTICE 'Analytics views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old sessions and optimize
CREATE OR REPLACE FUNCTION cleanup_old_data(p_days_old INT DEFAULT 90)
RETURNS TABLE (
    old_sessions_deleted INT,
    old_guesses_deleted INT
) AS $$
DECLARE
    sessions_deleted INT := 0;
    guesses_deleted INT := 0;
BEGIN
    -- Delete old closed sessions and their associated guesses
    WITH deleted_sessions AS (
        DELETE FROM game_sessions 
        WHERE status = 'closed' 
        AND ended_at < NOW() - (p_days_old || ' days')::INTERVAL 
        RETURNING id
    )
    SELECT COUNT(*) INTO sessions_deleted FROM deleted_sessions;
    
    -- The guesses should be automatically deleted due to CASCADE
    -- But let's also clean up any orphaned guesses just in case
    DELETE FROM guesses 
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND NOT EXISTS (SELECT 1 FROM game_sessions WHERE id = guesses.session_id);
    
    GET DIAGNOSTICS guesses_deleted = ROW_COUNT;
    
    -- Analyze tables for better performance
    ANALYZE game_sessions;
    ANALYZE guesses;
    ANALYZE user_stats;
    
    RETURN QUERY SELECT sessions_deleted, guesses_deleted;
END;
$$ LANGUAGE plpgsql;

-- Record this migration
INSERT INTO schema_migrations (version, description) 
VALUES ('003_indexes_and_performance', 'Advanced indexes, performance functions, analytics views, and maintenance procedures');

-- Success message
RAISE NOTICE 'Migration 003_indexes_and_performance completed successfully';

COMMIT;