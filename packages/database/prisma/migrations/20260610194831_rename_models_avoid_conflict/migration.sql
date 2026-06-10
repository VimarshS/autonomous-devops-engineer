/*
  Warnings:

  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_userId_fkey";

-- DropTable
DROP TABLE "sessions";

-- CreateTable
CREATE TABLE "app_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_sessions_refreshToken_key" ON "app_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "app_sessions_userId_idx" ON "app_sessions"("userId");

-- CreateIndex
CREATE INDEX "app_sessions_refreshToken_idx" ON "app_sessions"("refreshToken");

-- AddForeignKey
ALTER TABLE "app_sessions" ADD CONSTRAINT "app_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
