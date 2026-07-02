import type { FastifyInstance } from "fastify";
import { expenseEventPayloadSchema } from "@autolife/shared";
import { prisma } from "../lib/prisma";
import { registerAuthGuard } from "../lib/guards";

const SOON_MS = 60 * 86_400_000; // reminders due within 60 days count as "due"

// Fleet-wide rollup for the Flotte screen: vehicle count, total mileage, total EUR spent,
// average latest AutoScore and the number of due reminders.
export async function fleetRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.get("/summary", async (request) => {
    const ownerships = await prisma.ownership.findMany({
      where: { userId: request.user.sub, to: null },
      include: { vehicle: true },
    });
    const vehicles = ownerships.map((o) => o.vehicle);
    const ids = vehicles.map((v) => v.id);
    const totalKm = vehicles.reduce((sum, v) => sum + (v.mileageKm ?? 0), 0);

    if (ids.length === 0) {
      return { vehicles: 0, totalKm: 0, totalSpentEur: 0, avgScore: 0, dueReminders: 0 };
    }

    const [expenses, scores, reminders] = await Promise.all([
      prisma.vehicleEvent.findMany({ where: { vehicleId: { in: ids }, type: "expense" } }),
      prisma.reliabilityScore.findMany({ where: { vehicleId: { in: ids } }, orderBy: { computedAt: "desc" } }),
      prisma.reminder.findMany({ where: { vehicleId: { in: ids }, completedAt: null } }),
    ]);

    let totalSpentEur = 0;
    for (const e of expenses) {
      const parsed = expenseEventPayloadSchema.safeParse(e.payload);
      if (parsed.success && parsed.data.currency === "EUR") totalSpentEur += parsed.data.amount;
    }

    // Latest score per vehicle (scores already sorted desc by computedAt).
    const latestScore = new Map<string, number>();
    for (const s of scores) if (!latestScore.has(s.vehicleId)) latestScore.set(s.vehicleId, s.score);
    const scoreVals = [...latestScore.values()];
    const avgScore = scoreVals.length
      ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length)
      : 0;

    const dueSoon = Date.now() + SOON_MS;
    const dueReminders = reminders.filter((r) => r.dueDate && +new Date(r.dueDate) <= dueSoon).length;

    return { vehicles: vehicles.length, totalKm, totalSpentEur, avgScore, dueReminders };
  });
}
