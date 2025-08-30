-- ===================================================================
-- MIGRATION: 001_initial_schema.sql
-- Description: Initial database schema for Human or AI Quiz App
-- Author: Database Architect Agent
-- Date: 2025-08-30
-- Dependencies: None
-- ===================================================================

BEGIN;

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_initial_schema') THEN
        RAISE NOTICE 'Migration 001_initial_schema already applied, skipping...';
        ROLLBACK;
    END IF;
END $$;

-- Create custom types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_type') THEN
        CREATE TYPE source_type AS ENUM ('ai','human');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('open','closed');
    END IF;
END $$;

-- ===================================================================
-- CORE TABLES
-- ===================================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL,
    css_category TEXT NOT NULL,
    theme_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT categories_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
    CONSTRAINT categories_domain_valid CHECK (domain IN ('literature', 'nonfiction', 'ai_narrative', 'ai_expository', 'other')),
    CONSTRAINT categories_css_valid CHECK (css_category IN ('grain', 'zen-edge', 'spark', 'shuffle', 'void', 'quartz', 'river')),
    CONSTRAINT categories_theme_is_object CHECK (jsonb_typeof(theme_tokens) = 'object')
);

-- Passages table
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT passages_text_length CHECK (length(text) >= 50 AND length(text) <= 10000),
    CONSTRAINT passages_source_year_valid CHECK (source_year IS NULL OR (source_year >= 1000 AND source_year <= 2100)),
    CONSTRAINT passages_time_consistency CHECK (created_at <= updated_at),
    CONSTRAINT passages_rand_key_range CHECK (rand_key >= 0 AND rand_key < 1)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    handle TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_handle_format CHECK (handle IS NULL OR (length(handle) >= 3 AND length(handle) <= 50 AND handle ~ '^[a-zA-Z0-9_-]+$'))
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status session_status NOT NULL DEFAULT 'open',
    score INT NOT NULL DEFAULT 0,
    streak INT NOT NULL DEFAULT 0,
    questions_answered INT NOT NULL DEFAULT 0,
    category_filter INT[] NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT game_sessions_score_positive CHECK (score >= 0),
    CONSTRAINT game_sessions_streak_positive CHECK (streak >= 0),
    CONSTRAINT game_sessions_questions_positive CHECK (questions_answered >= 0),
    CONSTRAINT game_sessions_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at),
    CONSTRAINT game_sessions_closed_has_end CHECK (status = 'open' OR ended_at IS NOT NULL)
);

-- Guesses table
CREATE TABLE IF NOT EXISTS guesses (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    passage_id BIGINT NOT NULL REFERENCES passages(id) ON DELETE RESTRICT,
    guess_source source_type NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT guesses_time_positive CHECK (time_ms >= 0)
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    games_played INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    correct INT NOT NULL DEFAULT 0,
    streak_best INT NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT user_stats_non_negative CHECK (games_played >= 0 AND total_questions >= 0 AND correct >= 0 AND streak_best >= 0),
    CONSTRAINT user_stats_correct_consistency CHECK (correct <= total_questions)
);

-- ===================================================================
-- BASIC INDEXES
-- ===================================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_domain ON categories(domain);
CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON categories(is_active, sort_order);

-- Passages basic indexes
CREATE INDEX IF NOT EXISTS idx_passages_category ON passages(category_id);
CREATE INDEX IF NOT EXISTS idx_passages_source ON passages(source_type);
CREATE INDEX IF NOT EXISTS idx_passages_rand ON passages(rand_key);
CREATE INDEX IF NOT EXISTS idx_passages_verified ON passages(verified);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle) WHERE handle IS NOT NULL;

-- Game sessions indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status ON game_sessions(user_id, status);

-- Guesses indexes
CREATE INDEX IF NOT EXISTS idx_guesses_session ON guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_guesses_user ON guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_guesses_passage ON guesses(passage_id);

-- ===================================================================
-- BASIC FUNCTIONS AND TRIGGERS
-- ===================================================================

-- Function to set random key for passages
CREATE OR REPLACE FUNCTION set_passage_rand_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rand_key IS NULL THEN 
        NEW.rand_key := random(); 
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generic function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply basic triggers
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

-- Record this migration
INSERT INTO schema_migrations (version, description) 
VALUES ('001_initial_schema', 'Initial database schema with core tables, basic indexes, and triggers');

-- Success message
RAISE NOTICE 'Migration 001_initial_schema completed successfully';

COMMIT;