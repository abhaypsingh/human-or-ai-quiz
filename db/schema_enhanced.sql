-- ===================================================================
-- ENHANCED DATABASE SCHEMA FOR PRODUCTION "HUMAN OR AI?" QUIZ APP
-- Author: Database Architect Agent
-- Date: 2025-08-30
-- ===================================================================

-- Custom types
CREATE TYPE source_type AS ENUM ('ai','human');
CREATE TYPE session_status AS ENUM ('open','closed');

-- ===================================================================
-- ENHANCED CATEGORIES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  css_category TEXT NOT NULL,
  theme_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Enhanced constraints
  CONSTRAINT categories_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
  CONSTRAINT categories_domain_valid CHECK (domain IN ('literature', 'nonfiction', 'ai_narrative', 'ai_expository', 'other')),
  CONSTRAINT categories_css_valid CHECK (css_category IN ('grain', 'zen-edge', 'spark', 'shuffle', 'void', 'quartz', 'river')),
  CONSTRAINT categories_theme_is_object CHECK (jsonb_typeof(theme_tokens) = 'object')
);

-- ===================================================================
-- ENHANCED PASSAGES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS passages (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  source_type source_type NOT NULL,
  reading_level INT NOT NULL CHECK (reading_level BETWEEN 1 AND 5),
  style_tags TEXT[] NOT NULL DEFAULT '{}',
  source_title TEXT,
  source_author TEXT,
  source_year INT,
  source_public_domain BOOLEAN,
  source_citation TEXT,
  generator_model TEXT,
  prompt_signature TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  rand_key DOUBLE PRECISION NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Enhanced constraints
  CONSTRAINT passages_text_length CHECK (length(text) >= 50 AND length(text) <= 10000),
  CONSTRAINT passages_source_year_valid CHECK (source_year IS NULL OR (source_year >= 1000 AND source_year <= 2100)),
  CONSTRAINT passages_time_consistency CHECK (created_at <= updated_at),
  CONSTRAINT passages_rand_key_range CHECK (rand_key >= 0 AND rand_key < 1)
);

-- ===================================================================
-- ENHANCED USERS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  handle TEXT UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Enhanced constraints
  CONSTRAINT users_handle_format CHECK (handle IS NULL OR (length(handle) >= 3 AND length(handle) <= 50 AND handle ~ '^[a-zA-Z0-9_-]+$'))
);

-- ===================================================================
-- ENHANCED GAME SESSIONS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status session_status NOT NULL DEFAULT 'open',
  score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  questions_answered INT NOT NULL DEFAULT 0,
  category_filter INT[] NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  
  -- Enhanced constraints
  CONSTRAINT game_sessions_score_positive CHECK (score >= 0),
  CONSTRAINT game_sessions_streak_positive CHECK (streak >= 0),
  CONSTRAINT game_sessions_questions_positive CHECK (questions_answered >= 0),
  CONSTRAINT game_sessions_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT game_sessions_closed_has_end CHECK (status = 'open' OR ended_at IS NOT NULL)
);

-- ===================================================================
-- ENHANCED GUESSES TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS guesses (
  id BIGSERIAL PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passage_id BIGINT NOT NULL REFERENCES passages(id) ON DELETE RESTRICT,
  guess_source source_type NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_ms INT NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Enhanced constraints
  CONSTRAINT guesses_time_positive CHECK (time_ms >= 0)
);

-- ===================================================================
-- ENHANCED USER STATS TABLE
-- ===================================================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  streak_best INT NOT NULL DEFAULT 0,
  last_played_at timestamptz,
  
  -- Enhanced constraints
  CONSTRAINT user_stats_non_negative CHECK (games_played >= 0 AND total_questions >= 0 AND correct >= 0 AND streak_best >= 0),
  CONSTRAINT user_stats_correct_consistency CHECK (correct <= total_questions)
);

-- ===================================================================
-- PERFORMANCE INDEXES
-- ===================================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_domain ON categories(domain);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON categories(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_updated ON categories(updated_at);

-- Passages performance indexes
CREATE INDEX IF NOT EXISTS idx_passages_category ON passages(category_id);
CREATE INDEX IF NOT EXISTS idx_passages_source ON passages(source_type);
CREATE INDEX IF NOT EXISTS idx_passages_rand ON passages(rand_key);
CREATE INDEX IF NOT EXISTS idx_passages_verified ON passages(verified);
CREATE INDEX IF NOT EXISTS idx_passages_reading_level ON passages(reading_level);
CREATE INDEX IF NOT EXISTS idx_passages_source_year ON passages(source_year) WHERE source_year IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_passages_updated ON passages(updated_at);
CREATE INDEX IF NOT EXISTS idx_passages_composite_query ON passages(category_id, source_type, verified, rand_key);
CREATE INDEX IF NOT EXISTS idx_passages_text_search ON passages USING GIN (to_tsvector('english', text));

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle) WHERE handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Game sessions indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status ON game_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started ON game_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_ended ON game_sessions(ended_at) WHERE ended_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(user_id) WHERE status = 'open';

-- Guesses indexes
CREATE INDEX IF NOT EXISTS idx_guesses_session ON guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_guesses_user ON guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_guesses_passage ON guesses(passage_id);
CREATE INDEX IF NOT EXISTS idx_guesses_created ON guesses(created_at);
CREATE INDEX IF NOT EXISTS idx_guesses_correctness ON guesses(is_correct);
CREATE INDEX IF NOT EXISTS idx_guesses_performance ON guesses(user_id, created_at, is_correct);

-- User stats indexes
CREATE INDEX IF NOT EXISTS idx_user_stats_last_played ON user_stats(last_played_at) WHERE last_played_at IS NOT NULL;

-- ===================================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- ===================================================================

-- Function to set random key for passages
CREATE OR REPLACE FUNCTION set_passage_rand_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rand_key IS NULL THEN NEW.rand_key := random(); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generic function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS passages_rand_key_before_insert ON passages;
CREATE TRIGGER passages_rand_key_before_insert
BEFORE INSERT ON passages
FOR EACH ROW EXECUTE FUNCTION set_passage_rand_key();

DROP TRIGGER IF EXISTS categories_updated_at_trigger ON categories;
CREATE TRIGGER categories_updated_at_trigger
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS passages_updated_at_trigger ON passages;
CREATE TRIGGER passages_updated_at_trigger
    BEFORE UPDATE ON passages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- COMPLEX QUERY FUNCTIONS
-- ===================================================================

-- Function to get random passages for quiz
CREATE OR REPLACE FUNCTION get_random_passages(
    p_category_ids INT[] DEFAULT NULL,
    p_limit INT DEFAULT 1,
    p_exclude_passage_ids BIGINT[] DEFAULT NULL,
    p_verified_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id BIGINT,
    text TEXT,
    category_id INT,
    source_type source_type,
    reading_level INT,
    category_name TEXT,
    category_domain TEXT
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
        c.domain as category_domain
    FROM passages p
    JOIN categories c ON p.category_id = c.id
    WHERE 
        (p_category_ids IS NULL OR p.category_id = ANY(p_category_ids))
        AND (p_exclude_passage_ids IS NULL OR NOT (p.id = ANY(p_exclude_passage_ids)))
        AND (NOT p_verified_only OR p.verified = true)
        AND c.is_active = true
    ORDER BY p.rand_key
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats(
    p_user_id uuid,
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
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        games_played = user_stats.games_played + 1,
        total_questions = user_stats.total_questions + p_questions_answered,
        correct = user_stats.correct + p_correct_answers,
        streak_best = GREATEST(user_stats.streak_best, p_current_streak),
        last_played_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to get user performance analytics
CREATE OR REPLACE FUNCTION get_user_performance(p_user_id uuid)
RETURNS TABLE (
    total_games INT,
    total_questions INT,
    total_correct INT,
    accuracy DECIMAL(5,2),
    best_streak INT,
    avg_response_time_ms DECIMAL(8,2),
    last_played timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(us.games_played, 0) as total_games,
        COALESCE(us.total_questions, 0) as total_questions,
        COALESCE(us.correct, 0) as total_correct,
        CASE 
            WHEN COALESCE(us.total_questions, 0) = 0 THEN 0.00
            ELSE ROUND((COALESCE(us.correct, 0)::DECIMAL / us.total_questions) * 100, 2)
        END as accuracy,
        COALESCE(us.streak_best, 0) as best_streak,
        COALESCE(AVG(g.time_ms), 0) as avg_response_time_ms,
        us.last_played_at as last_played
    FROM user_stats us
    LEFT JOIN guesses g ON g.user_id = us.user_id
    WHERE us.user_id = p_user_id
    GROUP BY us.user_id, us.games_played, us.total_questions, us.correct, us.streak_best, us.last_played_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get category performance stats
CREATE OR REPLACE FUNCTION get_category_performance()
RETURNS TABLE (
    category_id INT,
    category_name TEXT,
    total_passages INT,
    total_guesses INT,
    correct_guesses INT,
    accuracy DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT p.id)::INT as total_passages,
        COUNT(g.id)::INT as total_guesses,
        COUNT(CASE WHEN g.is_correct THEN 1 END)::INT as correct_guesses,
        CASE 
            WHEN COUNT(g.id) = 0 THEN 0.00
            ELSE ROUND((COUNT(CASE WHEN g.is_correct THEN 1 END)::DECIMAL / COUNT(g.id)) * 100, 2)
        END as accuracy
    FROM categories c
    LEFT JOIN passages p ON p.category_id = c.id
    LEFT JOIN guesses g ON g.passage_id = p.id
    WHERE c.is_active = true
    GROUP BY c.id, c.name
    ORDER BY c.sort_order, c.name;
END;
$$ LANGUAGE plpgsql;