import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { registerAuthGuard } from "../lib/guards";

type Severity = "info" | "warning" | "danger";

function severity(date: Date | null): Severity {
  if (!date) return "info";
  const days = Math.ceil((+new Date(date) - Date.now()) / 86_400_000);
  if (days < 0) return "danger";
  if (days < 30) return "warning";
  return "info";
}

// Cross-fleet notification feed: open reminders and expiring documents for every vehicle the
// user owns, soonest first.
export async function notificationRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.get("/", async (request) => {
    const ownerships = await prisma.ownership.findMany({
      where: { userId: request.user.sub, to: null },
      include: { vehicle: true },
    });
    const ids = ownerships.map((o) => o.vehicle.id);
    const nameById = new Map(ownerships.map((o) => [o.vehicle.id, `${o.vehicle.make} ${o.vehicle.model}`]));

    if (ids.length === 0) return [];

    const [reminders, documents] = await Promise.all([
      prisma.reminder.findMany({ where: { vehicleId: { in: ids }, completedAt: null } }),
      prisma.document.findMany({ where: { vehicleId: { in: ids }, expiresAt: { not: null } } }),
    ]);

    const items = [
      ...reminders.map((r) => ({
        id: `rem-${r.id}`,
        vehicleId: r.vehicleId,
        vehicleName: nameById.get(r.vehicleId) ?? "",
        kind: "reminder" as const,
        title: r.title,
        date: r.dueDate ? r.dueDate.toISOString() : null,
        severity: severity(r.dueDate),
      })),
      ...documents.map((d) => ({
        id: `doc-${d.id}`,
        vehicleId: d.vehicleId,
        vehicleName: nameById.get(d.vehicleId) ?? "",
        kind: "document" as const,
        title: d.title ?? d.type,
        date: d.expiresAt ? d.expiresAt.toISOString() : null,
        severity: severity(d.expiresAt),
      })),
    ];

    return items.sort(
      (a, b) => (a.date ? +new Date(a.date) : Infinity) - (b.date ? +new Date(b.date) : Infinity),
    );
  });
}
