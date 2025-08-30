#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/categories_seed.sql
# Example for loading AI CSV seed (adjust file path):
# psql "$DATABASE_URL" -c "\copy passages (text,category_id,source_type,reading_level,style_tags,generator_model,prompt_signature,rand_key) FROM 'db/seed/ai_passages.csv' CSV HEADER"