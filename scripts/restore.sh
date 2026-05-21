#!/bin/bash
# Database Restore Script for MASAP-UGANC Portal
# 
# Usage: ./restore.sh <backup_file>
#   backup_file: Path to the backup file to restore

set -e

# Configuration
DB_NAME="${POSTGRES_DB:-masap_uganc}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MASAP-UGANC Database Restore ===${NC}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: ./restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/masap_*.sql* 2>/dev/null || echo "  No backups found in ./backups/"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Verify checksum if available
if [ -f "${BACKUP_FILE}.md5" ]; then
    echo -e "${YELLOW}Verifying backup integrity...${NC}"
    if md5sum -c "${BACKUP_FILE}.md5" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Checksum verified${NC}"
    else
        echo -e "${RED}✗ Checksum verification failed! The backup file may be corrupted.${NC}"
        exit 1
    fi
fi

# Confirm restore operation
echo ""
echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo "Target database: $DB_NAME"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

# Export password for psql
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"

# Determine backup type and restore accordingly
echo -e "${YELLOW}Starting restore process...${NC}"

if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    # Compressed SQL dump
    echo "Restoring from compressed SQL dump..."
    
    # Drop and recreate database
    echo "Recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};"
    
    # Restore data
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
    
elif [[ "$BACKUP_FILE" == *.sql ]]; then
    # Plain SQL dump
    echo "Restoring from plain SQL dump..."
    
    # Drop and recreate database
    echo "Recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};"
    
    # Restore data
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
    
else
    echo -e "${RED}Error: Unknown backup file format${NC}"
    echo "Supported formats: .sql, .sql.gz"
    exit 1
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
    
    # Verify database connection
    echo -e "${YELLOW}Verifying database connection...${NC}"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection verified${NC}"
    else
        echo -e "${RED}✗ Database connection test failed${NC}"
    fi
else
    echo -e "${RED}✗ Restore failed!${NC}"
    exit 1
fi

unset PGPASSWORD

echo ""
echo -e "${GREEN}=== Restore Complete ===${NC}"
