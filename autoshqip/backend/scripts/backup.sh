#!/usr/bin/env bash
# Daily PostgreSQL backup — runs inside the autoshqip_db Docker container
# Keeps 30 days of backups, then purges older files
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/home/static-tony/Desktop/vistomotors-main/vistomotors-main/autoshqip/backups}"
CONTAINER="${DB_CONTAINER:-autoshqip_db}"
DB_NAME="${DB_NAME:-autoshqip}"
DB_USER="${DB_USER:-autoshqip}"
KEEP_DAYS="${KEEP_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/autoshqip_${TIMESTAMP}.sql.gz"

echo "[backup] Starting dump → $FILE"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"
echo "[backup] Done. Size: $(du -sh "$FILE" | cut -f1)"

# Purge backups older than KEEP_DAYS days
find "$BACKUP_DIR" -name "autoshqip_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "[backup] Old backups (>${KEEP_DAYS}d) purged."
