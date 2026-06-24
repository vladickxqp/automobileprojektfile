-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('service', 'insurance', 'tuv', 'oil', 'custom');

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "kind" "ReminderKind" NOT NULL DEFAULT 'custom',
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dueMileageKm" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_vehicleId_idx" ON "reminders"("vehicleId");

-- CreateIndex
CREATE INDEX "reminders_dueDate_idx" ON "reminders"("dueDate");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
