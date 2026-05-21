#!/bin/bash
# Database Backup Script for MASAP-UGANC Portal
# 
# Usage: ./backup.sh [backup_type]
#   backup_type: full (default), data_only, schema_only

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_NAME="${POSTGRES_DB:-masap_uganc}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}=== MASAP-UGANC Database Backup ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Database: $DB_NAME"
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Function to perform backup
perform_backup() {
    local backup_type=$1
    local filename=""
    local pg_dump_opts=""
    
    case $backup_type in
        full)
            filename="masap_full_${TIMESTAMP}.sql.gz"
            pg_dump_opts="--format=custom --compress=9 --verbose"
            echo -e "${YELLOW}Performing full backup (schema + data)...${NC}"
            ;;
        data_only)
            filename="masap_data_${TIMESTAMP}.sql.gz"
            pg_dump_opts="--data-only --compress=9 --verbose"
            echo -e "${YELLOW}Performing data-only backup...${NC}"
            ;;
        schema_only)
            filename="masap_schema_${TIMESTAMP}.sql"
            pg_dump_opts="--schema-only --verbose"
            echo -e "${YELLOW}Performing schema-only backup...${NC}"
            ;;
        *)
            echo -e "${RED}Error: Unknown backup type '$backup_type'${NC}"
            echo "Valid options: full, data_only, schema_only"
            exit 1
            ;;
    esac
    
    local filepath="$BACKUP_DIR/$filename"
    
    # Export password for psql/pg_dump
    export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
    
    # Perform the backup
    if [[ "$backup_type" == "full" || "$backup_type" == "data_only" ]]; then
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" $pg_dump_opts "$DB_NAME" | gzip > "$filepath"
    else
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" $pg_dump_opts "$DB_NAME" > "$filepath"
    fi
    
    # Check if backup was successful
    if [ $? -eq 0 ] && [ -f "$filepath" ]; then
        local size=$(du -h "$filepath" | cut -f1)
        echo -e "${GREEN}✓ Backup completed successfully: $filepath ($size)${NC}"
        
        # Generate MD5 checksum
        md5sum "$filepath" > "${filepath}.md5"
        echo -e "${GREEN}✓ Checksum generated: ${filepath}.md5${NC}"
    else
        echo -e "${RED}✗ Backup failed!${NC}"
        exit 1
    fi
    
    unset PGPASSWORD
}

# Function to clean old backups
cleanup_old_backups() {
    echo ""
    echo -e "${YELLOW}Cleaning up backups older than $RETENTION_DAYS days...${NC}"
    
    find "$BACKUP_DIR" -name "masap_*.sql*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.md5" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    echo -e "${GREEN}✓ Cleanup completed${NC}"
}

# Function to list backups
list_backups() {
    echo ""
    echo -e "${GREEN}=== Available Backups ===${NC}"
    ls -lh "$BACKUP_DIR"/masap_*.sql* 2>/dev/null || echo "No backups found"
}

# Main execution
BACKUP_TYPE="${1:-full}"

if [ "$1" == "list" ]; then
    list_backups
    exit 0
fi

if [ "$1" == "clean" ]; then
    cleanup_old_backups
    exit 0
fi

perform_backup "$BACKUP_TYPE"
cleanup_old_backups
list_backups

echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
