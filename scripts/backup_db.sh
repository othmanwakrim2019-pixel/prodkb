#!/bin/bash

# Configuration
DB_CONTAINER="prodkb-postgres"
DB_USER="prodkb"
DB_NAME="prodkb"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting backup of $DB_NAME at $TIMESTAMP..."
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "Backup successful! File: $BACKUP_FILE"
  # Optional: Retention policy (keep last 7 days)
  find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -exec rm {} \;
else
  echo "Backup failed!"
  exit 1
fi
