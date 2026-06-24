import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  expenseEventPayloadSchema,
  maintenanceEventPayloadSchema,
  visibilitySchema,
} from "@autolife/shared";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";

const baseEvent = {
  occurredAt: z.coerce.date(),
  mileageKm: z.number().int().nonnegative().optional(),
};

// Service history defaults to the carDNA layer (it raises resale value); expenses stay private.
const createEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("maintenance"),
    ...baseEvent,
    visibility: visibilitySchema.default("carDNA"),
    payload: maintenanceEventPayloadSchema,
  }),
  z.object({
    type: z.literal("repair"),
    ...baseEvent,
    visibility: visibilitySchema.default("carDNA"),
    payload: maintenanceEventPayloadSchema,
  }),
  z.object({
    type: z.literal("expense"),
    ...baseEvent,
    visibility: visibilitySchema.default("private"),
    payload: expenseEventPayloadSchema,
  }),
]);

const listQuerySchema = z.object({
  type: z.enum(["maintenance", "repair", "expense"]).optional(),
});

export async function eventRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  // Timeline (#6): the vehicle's events, newest first, optionally filtered by type.
  app.get("/:id/events", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const { type } = listQuerySchema.parse(request.query);
    return prisma.vehicleEvent.findMany({
      where: { vehicleId: id, ...(type ? { type } : {}) },
      orderBy: { occurredAt: "desc" },
    });
  });

  app.post("/:id/events", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const body = createEventSchema.parse(request.body);
    const event = await prisma.vehicleEvent.create({
      data: {
        vehicleId: id,
        type: body.type,
        occurredAt: body.occurredAt,
        mileageKm: body.mileageKm ?? null,
        visibility: body.visibility,
        payload: body.payload as Prisma.InputJsonValue,
        createdByUserId: request.user.sub,
      },
    });
    return reply.code(201).send(event);
  });

  // Expense summary (#9): totals per currency and per category, computed from expense events.
  app.get("/:id/expenses/summary", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const events = await prisma.vehicleEvent.findMany({
      where: { vehicleId: id, type: "expense" },
    });

    const byCurrency: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const e of events) {
      const parsed = expenseEventPayloadSchema.safeParse(e.payload);
      if (!parsed.success) continue;
      const { currency, category, amount } = parsed.data;
      byCurrency[currency] = (byCurrency[currency] ?? 0) + amount;
      byCategory[category] = (byCategory[category] ?? 0) + amount;
    }
    return { count: events.length, byCurrency, byCategory };
  });
}
