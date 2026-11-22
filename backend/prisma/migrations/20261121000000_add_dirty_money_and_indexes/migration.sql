-- AlterTable
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "dirtyMoney" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "players_firstSeen_idx" ON "players"("firstSeen");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_serverId_timestamp_idx" ON "events"("serverId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "transactions_source_timestamp_idx" ON "transactions"("source", "timestamp" DESC);
