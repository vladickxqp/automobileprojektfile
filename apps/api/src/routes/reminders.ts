import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { reminderKindSchema } from "@autolife/shared";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";

const createReminderSchema = z.object({
  kind: reminderKindSchema.default("custom"),
  title: z.string().min(1).max(160),
  dueDate: z.coerce.date().optional(),
  dueMileageKm: z.number().int().nonnegative().optional(),
});

function docTypeToKind(type: string): "insurance" | "tuv" | "custom" {
  if (type === "insurance") return "insurance";
  if (type === "tuv") return "tuv";
  return "custom";
}

export async function reminderRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  // Unified view (#8): explicit reminders + reminders derived from document expiry, by due date.
  app.get("/:id/reminders", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;

    const [explicit, expiringDocs] = await Promise.all([
      prisma.reminder.findMany({ where: { vehicleId: id, completedAt: null } }),
      prisma.document.findMany({ where: { vehicleId: id, expiresAt: { not: null } } }),
    ]);

    const fromUser = explicit.map((r) => ({
      id: r.id,
      vehicleId: id,
      kind: r.kind,
      title: r.title,
      dueDate: r.dueDate,
      dueMileageKm: r.dueMileageKm,
      completedAt: r.completedAt,
      source: "user" as const,
    }));

    const fromDocs = expiringDocs.map((d) => ({
      id: `doc:${d.id}`,
      vehicleId: id,
      kind: docTypeToKind(d.type),
      title: d.title ?? d.type,
      dueDate: d.expiresAt,
      dueMileageKm: null as number | null,
      completedAt: null as Date | null,
      source: "document" as const,
    }));

    return [...fromUser, ...fromDocs].sort((a, b) => {
      const ta = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
      const tb = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  });

  app.post("/:id/reminders", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const body = createReminderSchema.parse(request.body);
    const reminder = await prisma.reminder.create({
      data: {
        vehicleId: id,
        kind: body.kind,
        title: body.title,
        dueDate: body.dueDate ?? null,
        dueMileageKm: body.dueMileageKm ?? null,
      },
    });
    return reply.code(201).send(reminder);
  });

  app.patch("/:id/reminders/:rid/complete", async (request, reply) => {
    const { id, rid } = request.params as { id: string; rid: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const result = await prisma.reminder.updateMany({
      where: { id: rid, vehicleId: id },
      data: { completedAt: new Date() },
    });
    if (result.count === 0) return reply.code(404).send({ error: "Reminder not found" });
    return { ok: true };
  });
}
