#!/bin/bash
# backup.sh - Script to backup Docker volumes for Eventia application
# This script should be run regularly via cron or another scheduler

set -e

# Configuration
BACKUP_DIR="/backups/eventia"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
VOLUMES=("eventia_postgres_data" "eventia_redis_data" "eventia_backend_data")

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Backup each volume
for VOLUME in "${VOLUMES[@]}"; do
  echo "Backing up volume: $VOLUME"
  
  # Create temporary container to access volume data, tar it, and output to backup directory
  docker run --rm \
    -v $VOLUME:/source:ro \
    -v $BACKUP_DIR:/backup \
    alpine:latest \
    tar -czf /backup/${VOLUME}_${TIMESTAMP}.tar.gz -C /source .
    
  echo "Completed backup of $VOLUME to $BACKUP_DIR/${VOLUME}_${TIMESTAMP}.tar.gz"
done

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days"
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully at $(date)"

# Optional: If you're using cloud storage, add commands to sync backups
# Example for AWS S3:
# aws s3 sync $BACKUP_DIR s3://your-backup-bucket/eventia/

# Exit successfully
exit 0 