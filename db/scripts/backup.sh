#!/bin/bash
# ===================================================================
# DATABASE BACKUP SCRIPT FOR HUMAN OR AI QUIZ APP
# Author: Database Architect Agent
# Date: 2025-08-30
# 
# This script creates comprehensive backups of the PostgreSQL database
# including schema, data, and metadata with proper error handling.
# ===================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DB_DIR")"
BACKUP_DIR="${DB_DIR}/backups"
LOG_FILE="${BACKUP_DIR}/backup.log"

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

# Backup configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PREFIX="${DB_NAME}_backup"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Database backup script for Human or AI Quiz application.

OPTIONS:
    -h, --help              Show this help message
    -d, --database NAME     Database name (default: $DEFAULT_DB_NAME)
    -u, --user USER         Database user (default: $DEFAULT_DB_USER)  
    -H, --host HOST         Database host (default: $DEFAULT_DB_HOST)
    -p, --port PORT         Database port (default: $DEFAULT_DB_PORT)
    -o, --output DIR        Output directory (default: $BACKUP_DIR)
    --schema-only           Backup schema only (no data)
    --data-only             Backup data only (no schema)
    --compress              Compress backup files
    --retention DAYS        Retention period in days (default: $RETENTION_DAYS)
    --dry-run               Show what would be done without executing
    --quiet                 Suppress non-error output

ENVIRONMENT VARIABLES:
    DATABASE_NAME           Override default database name
    DATABASE_USER           Override default database user
    DATABASE_HOST           Override default database host
    DATABASE_PORT           Override default database port
    DATABASE_PASSWORD       Database password (recommended over -W prompt)

EXAMPLES:
    $0                                          # Basic backup with defaults
    $0 --compress --retention 60               # Compressed backup, 60-day retention
    $0 --schema-only -o /tmp/backups           # Schema-only backup to /tmp/backups
    $0 -d production_db -u app_user            # Custom database and user
EOF
}

# ===================================================================
# BACKUP FUNCTIONS
# ===================================================================

check_dependencies() {
    local deps=("pg_dump" "psql" "gzip")
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

test_connection() {
    info "Testing database connection..."
    
    local conn_test
    conn_test=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT 1;" 2>/dev/null | xargs || echo "failed")
    
    if [ "$conn_test" != "1" ]; then
        error "Cannot connect to database $DB_NAME on $DB_HOST:$DB_PORT as user $DB_USER"
        error "Please check your connection parameters and credentials"
        exit 1
    fi
    
    success "Database connection successful"
}

get_database_info() {
    info "Gathering database information..."
    
    local db_size
    db_size=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs)
    
    local table_count
    table_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    
    info "Database size: $db_size"
    info "Table count: $table_count"
}

create_backup_directories() {
    mkdir -p "$BACKUP_DIR"/{full,schema,data,logs}
    
    if [ ! -w "$BACKUP_DIR" ]; then
        error "Backup directory $BACKUP_DIR is not writable"
        exit 1
    fi
}

perform_full_backup() {
    local backup_file="${BACKUP_DIR}/full/${BACKUP_PREFIX}_full_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    info "Creating full database backup..."
    info "Output file: $backup_file"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create full backup: $backup_file"
        return 0
    fi
    
    # Create the backup
    if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --format=plain \
        --no-owner \
        --no-privileges \
        --create \
        --clean \
        --if-exists \
        > "$backup_file" 2>>"$LOG_FILE"; then
        
        success "Full backup completed: $backup_file"
        
        # Compress if requested
        if [ "$COMPRESS" = true ]; then
            info "Compressing backup file..."
            gzip "$backup_file"
            success "Backup compressed: $compressed_file"
            echo "$compressed_file"
        else
            echo "$backup_file"
        fi
    else
        error "Full backup failed"
        return 1
    fi
}

perform_schema_backup() {
    local backup_file="${BACKUP_DIR}/schema/${BACKUP_PREFIX}_schema_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    info "Creating schema-only backup..."
    info "Output file: $backup_file"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create schema backup: $backup_file"
        return 0
    fi
    
    # Create the schema backup
    if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --schema-only \
        --format=plain \
        --no-owner \
        --no-privileges \
        --create \
        --clean \
        --if-exists \
        > "$backup_file" 2>>"$LOG_FILE"; then
        
        success "Schema backup completed: $backup_file"
        
        # Compress if requested
        if [ "$COMPRESS" = true ]; then
            info "Compressing schema file..."
            gzip "$backup_file"
            success "Schema backup compressed: $compressed_file"
            echo "$compressed_file"
        else
            echo "$backup_file"
        fi
    else
        error "Schema backup failed"
        return 1
    fi
}

perform_data_backup() {
    local backup_file="${BACKUP_DIR}/data/${BACKUP_PREFIX}_data_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"
    
    info "Creating data-only backup..."
    info "Output file: $backup_file"
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create data backup: $backup_file"
        return 0
    fi
    
    # Create the data backup
    if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --data-only \
        --format=plain \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        > "$backup_file" 2>>"$LOG_FILE"; then
        
        success "Data backup completed: $backup_file"
        
        # Compress if requested
        if [ "$COMPRESS" = true ]; then
            info "Compressing data file..."
            gzip "$backup_file"
            success "Data backup compressed: $compressed_file"
            echo "$compressed_file"
        else
            echo "$backup_file"
        fi
    else
        error "Data backup failed"
        return 1
    fi
}

create_backup_manifest() {
    local manifest_file="${BACKUP_DIR}/backup_manifest_${TIMESTAMP}.json"
    local backup_files=("$@")
    
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would create manifest: $manifest_file"
        return 0
    fi
    
    info "Creating backup manifest..."
    
    cat > "$manifest_file" << EOF
{
  "backup_id": "${BACKUP_PREFIX}_${TIMESTAMP}",
  "timestamp": "$(date -Iseconds)",
  "database": {
    "name": "$DB_NAME",
    "host": "$DB_HOST",
    "port": "$DB_PORT",
    "user": "$DB_USER"
  },
  "backup_type": "${BACKUP_TYPE:-full}",
  "compressed": $COMPRESS,
  "files": [
EOF

    local first=true
    for file in "${backup_files[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            echo "," >> "$manifest_file"
        fi
        
        local size="0"
        if [ -f "$file" ]; then
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        fi
        
        cat >> "$manifest_file" << EOF
    {
      "path": "$file",
      "size": $size,
      "checksum": "$(sha256sum "$file" 2>/dev/null | cut -d' ' -f1 || echo 'unavailable')"
    }
EOF
    done

    cat >> "$manifest_file" << EOF

  ],
  "retention_until": "$(date -d "+$RETENTION_DAYS days" -Iseconds 2>/dev/null || date -v+${RETENTION_DAYS}d -Iseconds 2>/dev/null || echo 'unavailable')",
  "script_version": "1.0.0"
}
EOF

    success "Backup manifest created: $manifest_file"
}

cleanup_old_backups() {
    if [ "$DRY_RUN" = true ]; then
        info "[DRY RUN] Would clean up backups older than $RETENTION_DAYS days"
        return 0
    fi
    
    info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Find and delete old backup files
    for dir in full schema data; do
        if [ -d "${BACKUP_DIR}/$dir" ]; then
            while IFS= read -r -d '' file; do
                rm -f "$file"
                ((deleted_count++))
                info "Deleted old backup: $(basename "$file")"
            done < <(find "${BACKUP_DIR}/$dir" -name "${BACKUP_PREFIX}_*" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null || true)
        fi
    done
    
    # Clean up old manifests
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
        info "Deleted old manifest: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "backup_manifest_*.json" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null || true)
    
    if [ $deleted_count -gt 0 ]; then
        success "Cleaned up $deleted_count old backup files"
    else
        info "No old backup files found to clean up"
    fi
}

# ===================================================================
# MAIN EXECUTION
# ===================================================================

main() {
    # Parse command line arguments
    SCHEMA_ONLY=false
    DATA_ONLY=false
    COMPRESS=false
    DRY_RUN=false
    QUIET=false
    
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
            -o|--output)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --schema-only)
                SCHEMA_ONLY=true
                BACKUP_TYPE="schema"
                shift
                ;;
            --data-only)
                DATA_ONLY=true
                BACKUP_TYPE="data"
                shift
                ;;
            --compress)
                COMPRESS=true
                shift
                ;;
            --retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --quiet)
                QUIET=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Redirect output if quiet mode
    if [ "$QUIET" = true ] && [ "$DRY_RUN" = false ]; then
        exec > "$LOG_FILE" 2>&1
    fi
    
    # Validate conflicting options
    if [ "$SCHEMA_ONLY" = true ] && [ "$DATA_ONLY" = true ]; then
        error "Cannot specify both --schema-only and --data-only"
        exit 1
    fi
    
    # Set backup type if not already set
    if [ "$SCHEMA_ONLY" = true ]; then
        BACKUP_TYPE="schema"
    elif [ "$DATA_ONLY" = true ]; then
        BACKUP_TYPE="data"
    else
        BACKUP_TYPE="full"
    fi
    
    info "=========================================="
    info "Human or AI Quiz Database Backup Script"
    info "=========================================="
    info "Backup type: $BACKUP_TYPE"
    info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    info "User: $DB_USER"
    info "Output directory: $BACKUP_DIR"
    info "Compression: $COMPRESS"
    info "Retention: $RETENTION_DAYS days"
    if [ "$DRY_RUN" = true ]; then
        warn "DRY RUN MODE - No actual changes will be made"
    fi
    info "=========================================="
    
    # Check dependencies
    check_dependencies
    
    # Create backup directories
    create_backup_directories
    
    # Test database connection
    test_connection
    
    # Get database information
    get_database_info
    
    # Perform backup based on type
    local backup_files=()
    
    if [ "$BACKUP_TYPE" = "schema" ]; then
        backup_file=$(perform_schema_backup)
        backup_files+=("$backup_file")
    elif [ "$BACKUP_TYPE" = "data" ]; then
        backup_file=$(perform_data_backup)
        backup_files+=("$backup_file")
    else
        backup_file=$(perform_full_backup)
        backup_files+=("$backup_file")
    fi
    
    # Create backup manifest
    create_backup_manifest "${backup_files[@]}"
    
    # Cleanup old backups
    cleanup_old_backups
    
    success "=========================================="
    success "Backup completed successfully!"
    success "Backup files: ${backup_files[*]}"
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