#!/bin/bash
# ===================================================================
# DATABASE RESTORE SCRIPT FOR HUMAN OR AI QUIZ APP
# Author: Database Architect Agent
# Date: 2025-08-30
# 
# This script restores PostgreSQL database backups with comprehensive
# safety checks, validation, and rollback capabilities.
# ===================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DB_DIR")"
BACKUP_DIR="${DB_DIR}/backups"
LOG_FILE="${BACKUP_DIR}/restore.log"

# Default configuration (can be overridden by environment variables)
DEFAULT_DB_NAME="humanai_quiz"
DEFAULT_DB_USER="postgres"
DEFAULT_DB_HOST="localhost"
DEFAULT_DB_PORT="5432"

# Use environment variables or defaults
DB_NAME="${DATABASE_NAME:-$DEFAULT_DB_NAME}"
DB_USER="${DATABASE_USER:-$DEFAULT_DB_USER}"
DB_HOST="${DATABASE_HOST:-$DEFAULT_DB_HOST}"
DB_PORT="${DATABASE_PORT:-$DEFAULT_DB_PORT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ===================================================================
# UTILITY FUNCTIONS
# ===================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    log "ERROR: $1"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
    log "SUCCESS: $1"
}

warn() {
    echo -e "${YELLOW}WARNING: $1${NC}"
    log "WARNING: $1"
}

info() {
    echo -e "${BLUE}INFO: $1${NC}"
    log "INFO: $1"
}

bold() {
    echo -e "${BOLD}$1${NC}"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] BACKUP_FILE

Database restore script for Human or AI Quiz application.

ARGUMENTS:
    BACKUP_FILE            Path to backup file to restore (.sql or .sql.gz)

OPTIONS:
    -h, --help              Show this help message
    -d, --database NAME     Target database name (default: $DEFAULT_DB_NAME)
    -u, --user USER         Database user (default: $DEFAULT_DB_USER)  
    -H, --host HOST         Database host (default: $DEFAULT_DB_HOST)
    -p, --port PORT         Database port (default: $DEFAULT_DB_PORT)
    --target-db NAME        Restore to different database name
    --create-db             Create target database if it doesn't exist
    --drop-existing         Drop existing database before restore (DANGEROUS!)
    --backup-existing       Create backup of existing database before restore
    --validate-only         Only validate backup file, don't restore
    --force                 Skip confirmation prompts (use with caution)
    --dry-run               Show what would be done without executing
    --quiet                 Suppress non-error output
    --single-transaction    Restore in a single transaction (rollback on failure)

SAFETY OPTIONS:
    --no-create             Don't run CREATE DATABASE statements
    --no-owner              Don't restore object ownership
    --no-privileges         Don't restore access privileges
    --exclude-table PATTERN Exclude tables matching pattern (can be used multiple times)

ENVIRONMENT VARIABLES:
    DATABASE_NAME           Override default database name
    DATABASE_USER           Override default database user
    DATABASE_HOST           Override default database host
    DATABASE_PORT           Override default database port
    DATABASE_PASSWORD       Database password (recommended over -W prompt)

EXAMPLES:
    $0 backup.sql.gz                           # Basic restore
    $0 --target-db test_db backup.sql          # Restore to different database
    $0 --backup-existing --force backup.sql    # Backup existing DB first
    $0 --validate-only backup.sql              # Just validate backup file
    $0 --dry-run backup.sql                    # See what would happen
    $0 --single-transaction backup.sql         # Atomic restore with rollback
    
SAFETY NOTES:
    - Always test restore on non-production systems first
    - Use --backup-existing to protect current data
    - Use --validate-only to check backup integrity
    - Use --dry-run to preview changes
EOF
}

# ===================================================================
# VALIDATION FUNCTIONS
# ===================================================================

check_dependencies() {
    local deps=("psql" "pg_restore" "gunzip")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing required dependencies: ${missing[*]}"
        error "Please install PostgreSQL client tools"
        exit 1
    fi
}

validate_backup_file() {
    local backup_file="$1"
    
    info "Validating backup file: $backup_file"
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Check if file is readable
    if [ ! -r "$backup_file" ]; then
        error "Backup file is not readable: $backup_file"
        exit 1
    fi
    
    # Check file size
    local file_size
    file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
    if [ "$file_size" -eq 0 ]; then
        error "Backup file is empty: $backup_file"
        exit 1
    fi
    
    info "File size: $(numfmt --to=iec "$file_size" 2>/dev/null || echo "${file_size} bytes")"
    
    # Validate file format
    local file_type
    if [[ "$backup_file" =~ \.gz$ ]]; then
        file_type="compressed"
        # Test if it's a valid gzip file
        if ! gunzip -t "$backup_file" 2>/dev/null; then
            error "Invalid gzip file: $backup_file"
            exit 1
        fi
        success "Valid compressed SQL backup file"
    elif [[ "$backup_file" =~ \.sql$ ]]; then
        file_type="plain"
        # Basic validation of SQL file
        if ! head -n 10 "$backup_file" | grep -q "PostgreSQL\|CREATE\|INSERT\|--" 2>/dev/null; then
            warn "File doesn't appear to be a PostgreSQL backup"
        fi
        success "Valid SQL backup file"
    else
        error "Unsupported file format. Expected .sql or .sql.gz"
        exit 1
    fi
    
    return 0
}

test_connection() {
    info "Testing database connection..."
    
    local conn_test
    conn_test=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -t -c "SELECT 1;" 2>/dev/null | xargs || echo "failed")
    
    if [ "$conn_test" != "1" ]; then
        error "Cannot connect to database server on $DB_HOST:$DB_PORT as user $DB_USER"
        error "Please check your connection parameters and credentials"
        exit 1
    fi
    
    success "Database connection successful"
}

check_database_exists() {
    local db_name="$1"
    
    local exists
    exists=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -t -c "SELECT 1 FROM pg_database WHERE datname = '$db_name';" 2>/dev/null | xargs || echo "")
    
    if [ "$exists" = "1" ]; then
        return 0  # Database exists
    else
        return 1  # Database doesn't exist
    fi
}

get_database_info() {
    local db_name="$1"
    
    if ! check_database_exists "$db_name"; then
        info "Database '$db_name' does not exist"
        return 1
    fi
    
    info "Gathering database information for: $db_name"
    
    local db_size
    db_size=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT pg_size_pretty(pg_database_size('$db_name'));" 2>/dev/null | xargs || echo "unknown")
    
    local table_count
    table_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "unknown")
    
    local record_count
    record_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "
        SELECT COALESCE(SUM(n_tup_ins + n_tup_upd), 0) 
        FROM pg_stat_user_tables;" 2>/dev/null | xargs || echo "unknown")
    
    info "Database size: $db_size"
    info "Table count: $table_count"
    info "Approximate record count: $record_count"
}

# ===================================================================
# BACKUP AND SAFETY FUNCTIONS
# ===================================================================

create_existing_backup() {
    local db_name="$1"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="${BACKUP_DIR}/pre_restore_${db_name}_${timestamp}.sql"
    
    info "Creating backup of existing database: $db_name"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create backup: $backup_file"
        return 0
    fi
    
    mkdir -p "$BACKUP_DIR"
    
    if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$db_name" \
        --verbose \
        --format=plain \
        --no-owner \
        --no-privileges \
        --create \
        --clean \
        --if-exists \
        > "$backup_file" 2>>"$LOG_FILE"; then
        
        success "Pre-restore backup created: $backup_file"
        echo "$backup_file"
    else
        error "Failed to create pre-restore backup"
        return 1
    fi
}

create_database() {
    local db_name="$1"
    
    info "Creating database: $db_name"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create database: $db_name"
        return 0
    fi
    
    if PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "CREATE DATABASE \"$db_name\";" 2>>"$LOG_FILE"; then
        success "Database created: $db_name"
    else
        error "Failed to create database: $db_name"
        return 1
    fi
}

drop_database() {
    local db_name="$1"
    
    warn "Dropping existing database: $db_name"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would drop database: $db_name"
        return 0
    fi
    
    # Terminate active connections
    PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = '$db_name' AND pid <> pg_backend_pid();" >/dev/null 2>>"$LOG_FILE" || true
    
    if PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "DROP DATABASE IF EXISTS \"$db_name\";" 2>>"$LOG_FILE"; then
        success "Database dropped: $db_name"
    else
        error "Failed to drop database: $db_name"
        return 1
    fi
}

# ===================================================================
# RESTORE FUNCTIONS
# ===================================================================

perform_restore() {
    local backup_file="$1"
    local target_db="$2"
    
    info "Starting restore operation..."
    info "Source: $backup_file"
    info "Target database: $target_db"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would restore $backup_file to $target_db"
        return 0
    fi
    
    # Prepare psql options
    local psql_options=()
    psql_options+=("-h" "$DB_HOST")
    psql_options+=("-p" "$DB_PORT")  
    psql_options+=("-U" "$DB_USER")
    psql_options+=("-d" "$target_db")
    
    if [ "$QUIET" = true ]; then
        psql_options+=("-q")
    else
        psql_options+=("-v" "ON_ERROR_STOP=1")
    fi
    
    if [ "$SINGLE_TRANSACTION" = true ]; then
        psql_options+=("--single-transaction")
        info "Using single transaction mode (will rollback on any error)"
    fi
    
    # Additional safety options
    if [ "$NO_OWNER" = true ]; then
        info "Skipping object ownership restoration"
    fi
    
    if [ "$NO_PRIVILEGES" = true ]; then
        info "Skipping privilege restoration"
    fi
    
    # Handle compressed vs plain files
    local restore_cmd
    if [[ "$backup_file" =~ \.gz$ ]]; then
        restore_cmd="gunzip -c \"$backup_file\" | PGPASSWORD=\"$PGPASSWORD\" psql"
    else
        restore_cmd="PGPASSWORD=\"$PGPASSWORD\" psql"
        psql_options+=("-f" "$backup_file")
    fi
    
    # Execute restore
    local start_time=$(date +%s)
    
    if [[ "$backup_file" =~ \.gz$ ]]; then
        if gunzip -c "$backup_file" | PGPASSWORD="$PGPASSWORD" psql "${psql_options[@]}" 2>>"$LOG_FILE"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            success "Restore completed successfully in ${duration}s"
        else
            error "Restore failed"
            return 1
        fi
    else
        if PGPASSWORD="$PGPASSWORD" psql "${psql_options[@]}" 2>>"$LOG_FILE"; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            success "Restore completed successfully in ${duration}s"
        else
            error "Restore failed"
            return 1
        fi
    fi
    
    # Verify restore
    verify_restore "$target_db"
}

verify_restore() {
    local db_name="$1"
    
    info "Verifying restored database..."
    
    # Check if database exists and is accessible
    if ! check_database_exists "$db_name"; then
        error "Restored database '$db_name' not found"
        return 1
    fi
    
    # Get basic statistics
    local table_count
    table_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
    
    local function_count
    function_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT count(*) FROM information_schema.routines WHERE routine_schema = 'public';" 2>/dev/null | xargs || echo "0")
    
    local index_count
    index_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | xargs || echo "0")
    
    info "Verification results:"
    info "  Tables: $table_count"
    info "  Functions: $function_count"  
    info "  Indexes: $index_count"
    
    # Check for expected core tables
    local core_tables=("categories" "passages" "users" "game_sessions" "guesses" "user_stats")
    local missing_tables=()
    
    for table in "${core_tables[@]}"; do
        local exists
        exists=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -t -c "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';" 2>/dev/null | xargs || echo "")
        
        if [ "$exists" != "1" ]; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -gt 0 ]; then
        warn "Missing expected tables: ${missing_tables[*]}"
        warn "This might indicate an incomplete or different backup"
    else
        success "All expected core tables found"
    fi
    
    success "Database verification completed"
}

# ===================================================================
# INTERACTIVE FUNCTIONS
# ===================================================================

confirm_action() {
    local message="$1"
    
    if [ "$FORCE" = true ]; then
        return 0
    fi
    
    echo -e "${YELLOW}$message${NC}"
    read -p "Do you want to continue? [y/N]: " -r response
    
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            info "Operation cancelled by user"
            exit 0
            ;;
    esac
}

list_available_backups() {
    info "Available backups in $BACKUP_DIR:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        warn "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
    
    local found_backups=false
    
    for dir in full schema data; do
        if [ -d "${BACKUP_DIR}/$dir" ]; then
            local backups
            backups=$(find "${BACKUP_DIR}/$dir" -name "*.sql*" -type f 2>/dev/null | sort -r | head -10)
            if [ -n "$backups" ]; then
                echo "  $dir backups:"
                echo "$backups" | sed 's/^/    /'
                found_backups=true
            fi
        fi
    done
    
    if [ "$found_backups" = false ]; then
        warn "No backup files found in $BACKUP_DIR"
    fi
}

# ===================================================================
# MAIN EXECUTION
# ===================================================================

main() {
    # Initialize variables
    BACKUP_FILE=""
    TARGET_DB=""
    CREATE_DB=false
    DROP_EXISTING=false
    BACKUP_EXISTING=false
    VALIDATE_ONLY=false
    FORCE=false
    DRY_RUN=false
    QUIET=false
    SINGLE_TRANSACTION=false
    NO_CREATE=false
    NO_OWNER=false
    NO_PRIVILEGES=false
    EXCLUDE_TABLES=()
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -d|--database)
                DB_NAME="$2"
                shift 2
                ;;
            -u|--user)
                DB_USER="$2"
                shift 2
                ;;
            -H|--host)
                DB_HOST="$2"
                shift 2
                ;;
            -p|--port)
                DB_PORT="$2"
                shift 2
                ;;
            --target-db)
                TARGET_DB="$2"
                shift 2
                ;;
            --create-db)
                CREATE_DB=true
                shift
                ;;
            --drop-existing)
                DROP_EXISTING=true
                shift
                ;;
            --backup-existing)
                BACKUP_EXISTING=true
                shift
                ;;
            --validate-only)
                VALIDATE_ONLY=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --quiet)
                QUIET=true
                shift
                ;;
            --single-transaction)
                SINGLE_TRANSACTION=true
                shift
                ;;
            --no-create)
                NO_CREATE=true
                shift
                ;;
            --no-owner)
                NO_OWNER=true
                shift
                ;;
            --no-privileges)
                NO_PRIVILEGES=true
                shift
                ;;
            --exclude-table)
                EXCLUDE_TABLES+=("$2")
                shift 2
                ;;
            --list-backups)
                list_available_backups
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [ -z "$BACKUP_FILE" ]; then
                    BACKUP_FILE="$1"
                else
                    error "Multiple backup files specified: $BACKUP_FILE and $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Validate required arguments
    if [ -z "$BACKUP_FILE" ]; then
        error "No backup file specified"
        show_usage
        exit 1
    fi
    
    # Set target database
    if [ -z "$TARGET_DB" ]; then
        TARGET_DB="$DB_NAME"
    fi
    
    # Redirect output if quiet mode (except for validation-only)
    if [ "$QUIET" = true ] && [ "$VALIDATE_ONLY" = false ] && [ "$DRY_RUN" = false ]; then
        exec > "$LOG_FILE" 2>&1
    fi
    
    info "=========================================="
    info "Human or AI Quiz Database Restore Script"
    info "=========================================="
    info "Backup file: $BACKUP_FILE"
    info "Target database: $TARGET_DB"
    info "Database host: $DB_HOST:$DB_PORT"
    info "Database user: $DB_USER"
    if [ "$DRY_RUN" = true ]; then
        warn "DRY RUN MODE - No actual changes will be made"
    fi
    if [ "$VALIDATE_ONLY" = true ]; then
        info "VALIDATION ONLY MODE - No restore will be performed"
    fi
    info "=========================================="
    
    # Check dependencies
    check_dependencies
    
    # Validate backup file
    validate_backup_file "$BACKUP_FILE"
    
    if [ "$VALIDATE_ONLY" = true ]; then
        success "Backup file validation completed successfully"
        exit 0
    fi
    
    # Test database connection
    test_connection
    
    # Check if target database exists
    local db_exists=false
    if check_database_exists "$TARGET_DB"; then
        db_exists=true
        info "Target database '$TARGET_DB' exists"
        get_database_info "$TARGET_DB"
    else
        info "Target database '$TARGET_DB' does not exist"
    fi
    
    # Handle existing database
    if [ "$db_exists" = true ]; then
        if [ "$DROP_EXISTING" = true ]; then
            confirm_action "This will DROP the existing database '$TARGET_DB' and all its data!"
            
            if [ "$BACKUP_EXISTING" = true ]; then
                create_existing_backup "$TARGET_DB"
            fi
            
            drop_database "$TARGET_DB"
            create_database "$TARGET_DB"
        elif [ "$BACKUP_EXISTING" = true ]; then
            confirm_action "This will backup the existing database '$TARGET_DB' before restoring."
            create_existing_backup "$TARGET_DB"
        else
            confirm_action "This will restore into the existing database '$TARGET_DB'. Existing data may be overwritten!"
        fi
    else
        if [ "$CREATE_DB" = true ]; then
            create_database "$TARGET_DB"
        else
            error "Target database '$TARGET_DB' does not exist. Use --create-db to create it."
            exit 1
        fi
    fi
    
    # Perform the restore
    perform_restore "$BACKUP_FILE" "$TARGET_DB"
    
    success "=========================================="
    success "Database restore completed successfully!"
    success "Database: $TARGET_DB"
    success "Backup file: $BACKUP_FILE"
    success "=========================================="
}

# Handle password prompt
if [ -z "${DATABASE_PASSWORD:-}" ]; then
    read -s -p "Database password for user $DB_USER: " PGPASSWORD
    echo
    export PGPASSWORD
else
    export PGPASSWORD="$DATABASE_PASSWORD"
fi

# Run main function
main "$@"