# Database Layer - Human or AI Quiz App

## Overview

This directory contains the complete database layer for the "Human or AI?" quiz application, including schema definitions, migrations, utilities, and seed data. The database is designed for PostgreSQL and includes comprehensive performance optimizations, data integrity constraints, and analytics capabilities.

## Architecture

### Core Tables

#### Categories
Stores text passage categories with theme configuration.
- **Purpose**: Define quiz categories (literature, nonfiction, AI-generated content)
- **Key Fields**: `name`, `domain`, `css_category`, `theme_tokens`
- **Constraints**: Validates domain and CSS category values
- **Features**: Active/inactive toggle, custom sorting order

#### Passages
Main content table storing text passages for the quiz.
- **Purpose**: Store all quiz passages with metadata
- **Key Fields**: `text`, `category_id`, `source_type`, `reading_level`
- **Constraints**: Text length validation, reading level bounds
- **Features**: Full-text search, verification status, random key for shuffling

#### Users
User account management.
- **Purpose**: Track user accounts and handles
- **Key Fields**: `id` (UUID), `handle`
- **Constraints**: Handle format validation
- **Features**: Optional anonymous usage

#### Game Sessions
Individual quiz game instances.
- **Purpose**: Track active and completed quiz sessions
- **Key Fields**: `user_id`, `status`, `score`, `streak`
- **Constraints**: Score/streak validation, end time consistency
- **Features**: Category filtering, session state management

#### Guesses
Individual user responses to quiz questions.
- **Purpose**: Record user guesses and performance metrics
- **Key Fields**: `session_id`, `passage_id`, `guess_source`, `is_correct`
- **Constraints**: Response time validation
- **Features**: Performance tracking, accuracy analysis

#### User Stats
Aggregated user performance statistics.
- **Purpose**: Store computed user performance metrics
- **Key Fields**: `games_played`, `total_questions`, `correct`, `streak_best`
- **Constraints**: Consistency validation between fields
- **Features**: Automatic updates via functions

## File Structure

```
db/
├── README.md                     # This documentation
├── schema.sql                    # Original schema (legacy)
├── schema_enhanced.sql           # Enhanced production schema
├── categories_seed.sql           # Original category seeds
├── load_seed.sh                  # Legacy seed loader
│
├── migrations/                   # Database migrations
│   ├── 001_initial_schema.sql    # Core schema setup
│   ├── 002_seed_categories.sql   # Category seed data (20 categories)
│   └── 003_indexes_and_performance.sql # Advanced indexes & functions
│
├── scripts/                      # Database utilities
│   ├── backup.sh                 # Comprehensive backup script
│   └── restore.sh                # Database restoration script
│
├── seeds/                        # Sample data
│   ├── human_passages_sample.sql # Sample human passages
│   └── ai_passages_sample.sql    # Sample AI passages
│
└── seed_prompts/                 # AI generation templates
    ├── ai_seed_prompt.txt        # Original AI prompt
    └── ai_seed_prompt_updated.txt # Updated prompt with new categories
```

## Setup Instructions

### 1. Initial Database Setup

```bash
# Create database
createdb humanai_quiz

# Run migrations in order
psql -d humanai_quiz -f migrations/001_initial_schema.sql
psql -d humanai_quiz -f migrations/002_seed_categories.sql
psql -d humanai_quiz -f migrations/003_indexes_and_performance.sql
```

### 2. Load Sample Data

```bash
# Load human passages
psql -d humanai_quiz -f seeds/human_passages_sample.sql

# Load AI passages  
psql -d humanai_quiz -f seeds/ai_passages_sample.sql
```

### 3. Environment Variables

Set these environment variables for scripts:

```bash
export DATABASE_NAME="humanai_quiz"
export DATABASE_USER="your_user"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_PASSWORD="your_password"
```

## Key Features

### Enhanced Schema Features

- **Comprehensive Constraints**: Data validation at database level
- **Performance Indexes**: Optimized for quiz queries and analytics
- **Full-Text Search**: GIN indexes on passage text
- **Update Triggers**: Automatic timestamp management
- **Transaction Safety**: All migrations use proper transaction handling

### Advanced Database Functions

#### `get_random_passages()`
Retrieves random passages for quiz questions with advanced filtering:
```sql
SELECT * FROM get_random_passages(
    p_category_ids := ARRAY[1,2,3],
    p_limit := 5,
    p_exclude_passage_ids := ARRAY[101,102],
    p_verified_only := true
);
```

#### `update_user_stats()`
Updates user statistics atomically:
```sql
SELECT update_user_stats(
    p_user_id := 'user-uuid',
    p_questions_answered := 10,
    p_correct_answers := 8,
    p_current_streak := 5
);
```

#### `get_user_performance()`
Comprehensive user analytics:
```sql
SELECT * FROM get_user_performance('user-uuid');
```

#### `get_category_performance()`
Category difficulty analysis:
```sql
SELECT * FROM get_category_performance();
```

#### `get_leaderboard()`
Generate ranked user leaderboards:
```sql
SELECT * FROM get_leaderboard(p_limit := 10);
```

### Materialized Views

#### `mv_category_analytics`
Pre-computed category statistics for dashboard display.
- **Refresh**: Use `SELECT refresh_analytics_views();`
- **Purpose**: Fast category performance metrics

## Category System

The database includes 20 comprehensive categories:

### Human Content Categories
1. **Classic Literature** - Public domain literary works
2. **Modern Fiction** - Contemporary fiction and narratives  
3. **Sci-Fi Literature** - Science fiction stories
4. **Fantasy Literature** - Fantasy and magical narratives
5. **Historical Fiction** - Period-specific narratives
6. **Poetry & Verse** - Poetic forms and verse
7. **Academic Writing** - Scholarly articles and papers
8. **Philosophy** - Philosophical discourse and ethics
9. **News & Journalism** - News articles and reportage
10. **Legal & Policy** - Legal documents and policy papers
11. **Biography & Memoir** - Personal narratives and life stories
12. **Scientific Writing** - Research papers and technical writing
13. **Travel Writing** - Travel narratives and cultural observations
14. **Technical Manuals** - Instructional and technical documentation

### AI-Generated Categories
15. **AI: Corporate Speak** - AI corporate communications
16. **AI: Flowery Prose** - Overly ornate AI prose
17. **AI: Generic Blog** - SEO-optimized AI content
18. **AI: Historical Pastiche** - AI mimicking historical styles
19. **AI: Academic Mimicry** - AI pseudo-academic writing
20. **AI: Creative Writing** - AI creative fiction attempts

## Performance Considerations

### Indexes
- **Primary Performance**: Composite indexes for quiz queries
- **Search Optimization**: GIN indexes for full-text search
- **Analytics**: Specialized indexes for statistics and reporting
- **Partial Indexes**: Conditional indexes for common filters

### Query Optimization
- **Random Selection**: Efficient random passage selection using `rand_key`
- **Category Filtering**: Optimized category-based queries
- **User Analytics**: Pre-computed statistics with incremental updates
- **Full-Text Search**: PostgreSQL native text search capabilities

## Backup and Recovery

### Automated Backups

```bash
# Full backup with compression
./scripts/backup.sh --compress --retention 30

# Schema-only backup
./scripts/backup.sh --schema-only

# Data-only backup  
./scripts/backup.sh --data-only
```

### Restoration

```bash
# Basic restore
./scripts/restore.sh backup_file.sql.gz

# Safe restore with backup
./scripts/restore.sh --backup-existing backup_file.sql

# Restore to different database
./scripts/restore.sh --target-db test_db backup_file.sql
```

## Maintenance Functions

### Cleanup Old Data
```sql
SELECT * FROM cleanup_old_data(90); -- Remove data older than 90 days
```

### Refresh Analytics
```sql
SELECT refresh_analytics_views(); -- Update materialized views
```

### Database Health Check
```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname = 'public';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes;
```

## Development Workflow

### Adding New Categories
1. Insert into categories table with proper constraints
2. Update category mapping in AI generation prompts
3. Add seed data for the new category
4. Test quiz functionality with new category

### Schema Changes
1. Create new migration file with sequential numbering
2. Use transaction blocks for safety
3. Add to migration tracking table
4. Test rollback scenarios

### Performance Monitoring
1. Monitor slow queries with `pg_stat_statements`
2. Check index usage with `pg_stat_user_indexes`  
3. Analyze query plans for complex operations
4. Update statistics regularly with `ANALYZE`

## Security Considerations

### Data Protection
- All user data uses UUID primary keys
- No personally identifiable information required
- Optional user handles with format validation
- Password handling managed at application level

### Access Control
- Database-level constraints prevent invalid data
- Transaction isolation for data consistency
- Backup encryption supported via script options
- Connection security via standard PostgreSQL methods

## Troubleshooting

### Common Issues

1. **Migration Failures**
   - Check migration tracking table: `SELECT * FROM schema_migrations;`
   - Verify database permissions
   - Review transaction logs

2. **Performance Issues**
   - Check query plans: `EXPLAIN ANALYZE SELECT ...`
   - Verify index usage: `SELECT * FROM pg_stat_user_indexes;`
   - Update table statistics: `ANALYZE;`

3. **Backup/Restore Problems**
   - Verify PostgreSQL client tools installation
   - Check connection parameters
   - Review log files in `backups/` directory

### Monitoring Queries

```sql
-- Active connections
SELECT * FROM pg_stat_activity WHERE datname = 'humanai_quiz';

-- Table statistics
SELECT * FROM pg_stat_user_tables;

-- Index statistics  
SELECT * FROM pg_stat_user_indexes;

-- Database size
SELECT pg_size_pretty(pg_database_size('humanai_quiz'));
```

## Contributing

When contributing to the database layer:

1. **Follow Migration Pattern**: Use sequential numbered migrations
2. **Add Constraints**: Validate data at database level
3. **Include Tests**: Test migrations on sample data
4. **Document Changes**: Update this README
5. **Performance Impact**: Consider index and query implications

## Version History

- **v1.0.0** (2025-08-30): Initial enhanced database layer
  - 20 comprehensive categories
  - Advanced indexing and performance functions
  - Automated backup/restore utilities
  - Sample seed data for testing
  - Complete migration system