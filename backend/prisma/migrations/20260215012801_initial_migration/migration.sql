-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MODERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EARN', 'SPEND', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADMIN_ADD', 'ADMIN_REMOVE');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('FRIEND', 'FACTION_MEMBER', 'ENEMY', 'TRADE_PARTNER');

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "serial" TEXT NOT NULL,
    "lastUsername" TEXT,
    "totalPlaytime" INTEGER NOT NULL DEFAULT 0,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "metadata" JSONB,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_sessions" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(3),
    "duration" INTEGER,
    "ip" TEXT,

    CONSTRAINT "player_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "playerId" INTEGER,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "positionZ" DOUBLE PRECISION,
    "data" JSONB NOT NULL,
    "serverId" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerId" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "metadata" JSONB,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_metrics" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalMoney" DOUBLE PRECISION NOT NULL,
    "moneyInCirc" DOUBLE PRECISION NOT NULL,
    "avgPlayerWealth" DOUBLE PRECISION NOT NULL,
    "inflationRate" DOUBLE PRECISION,
    "metadata" JSONB,

    CONSTRAINT "economic_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_relationships" (
    "id" SERIAL NOT NULL,
    "playerAId" INTEGER NOT NULL,
    "playerBId" INTEGER NOT NULL,
    "type" "RelationType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "interactions" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_metrics" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "hourly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "players_serial_key" ON "players"("serial");

-- CreateIndex
CREATE INDEX "players_serial_idx" ON "players"("serial");

-- CreateIndex
CREATE INDEX "players_lastSeen_idx" ON "players"("lastSeen");

-- CreateIndex
CREATE INDEX "players_riskScore_idx" ON "players"("riskScore");

-- CreateIndex
CREATE INDEX "player_sessions_playerId_idx" ON "player_sessions"("playerId");

-- CreateIndex
CREATE INDEX "player_sessions_loginAt_idx" ON "player_sessions"("loginAt");

-- CreateIndex
CREATE INDEX "events_eventType_timestamp_idx" ON "events"("eventType", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "events_playerId_timestamp_idx" ON "events"("playerId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "events_timestamp_idx" ON "events"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_playerId_timestamp_idx" ON "transactions"("playerId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_type_timestamp_idx" ON "transactions"("type", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "economic_metrics_timestamp_idx" ON "economic_metrics"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "player_relationships_playerAId_idx" ON "player_relationships"("playerAId");

-- CreateIndex
CREATE INDEX "player_relationships_playerBId_idx" ON "player_relationships"("playerBId");

-- CreateIndex
CREATE UNIQUE INDEX "player_relationships_playerAId_playerBId_type_key" ON "player_relationships"("playerAId", "playerBId", "type");

-- CreateIndex
CREATE INDEX "hourly_metrics_timestamp_idx" ON "hourly_metrics"("timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "hourly_metrics_timestamp_metricName_key" ON "hourly_metrics"("timestamp", "metricName");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_sessions" ADD CONSTRAINT "player_sessions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_relationships" ADD CONSTRAINT "player_relationships_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_relationships" ADD CONSTRAINT "player_relationships_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
