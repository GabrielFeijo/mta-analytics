-- Add online status flag to players
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false;

-- Drop redundant indexes already covered by unique constraints
DROP INDEX IF EXISTS "players_serial_idx";
DROP INDEX IF EXISTS "player_relationships_playerAId_idx";

-- Add missing performance indexes
CREATE INDEX IF NOT EXISTS "players_isOnline_lastSeen_idx" ON "players"("isOnline", "lastSeen" DESC);
CREATE INDEX IF NOT EXISTS "player_sessions_playerId_logoutAt_idx" ON "player_sessions"("playerId", "logoutAt");
CREATE INDEX IF NOT EXISTS "transactions_timestamp_idx" ON "transactions"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "sessions_adminId_idx" ON "sessions"("adminId");
CREATE INDEX IF NOT EXISTS "sessions_expiresAt_idx" ON "sessions"("expiresAt");
