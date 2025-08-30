CREATE TYPE source_type AS ENUM ('ai','human');
CREATE TYPE session_status AS ENUM ('open','closed');

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  css_category TEXT NOT NULL,
  theme_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_passages_category ON passages(category_id);
CREATE INDEX IF NOT EXISTS idx_passages_source ON passages(source_type);
CREATE INDEX IF NOT EXISTS idx_passages_rand ON passages(rand_key);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  handle TEXT UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status session_status NOT NULL DEFAULT 'open',
  score INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  questions_answered INT NOT NULL DEFAULT 0,
  category_filter INT[] NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS guesses (
  id BIGSERIAL PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passage_id BIGINT NOT NULL REFERENCES passages(id) ON DELETE RESTRICT,
  guess_source source_type NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_ms INT NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  games_played INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  streak_best INT NOT NULL DEFAULT 0,
  last_played_at timestamptz
);

-- helper to set rand_key if missing
CREATE OR REPLACE FUNCTION set_passage_rand_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rand_key IS NULL THEN NEW.rand_key := random(); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS passages_rand_key_before_insert ON passages;
CREATE TRIGGER passages_rand_key_before_insert
BEFORE INSERT ON passages
FOR EACH ROW EXECUTE FUNCTION set_passage_rand_key();