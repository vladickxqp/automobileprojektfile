import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { vinSchema } from "@autolife/shared";
import { prisma } from "../lib/prisma";

const createVehicleSchema = z.object({
  vin: vinSchema,
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1900).max(2100),
  engine: z.string().max(120).optional(),
  plate: z.string().max(20).optional(),
  mileageKm: z.number().int().nonnegative().optional(),
});

export async function vehicleRoutes(app: FastifyInstance) {
  // Every route here requires a valid token.
  app.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  // List the current user's vehicles. Note: we reach them through Ownership, never via a
  // direct user FK — that indirection is exactly what makes the cross-owner CarDNA model work.
  app.get("/", async (request) => {
    const ownerships = await prisma.ownership.findMany({
      where: { userId: request.user.sub, to: null },
      include: { vehicle: true },
      orderBy: { from: "desc" },
    });
    return ownerships.map((o) => o.vehicle);
  });

  // Add a vehicle (by VIN) and open the current-owner Ownership in one transaction.
  // upsert on VIN: if the car already exists in the system, we attach a new owner to its history.
  app.post("/", async (request, reply) => {
    const body = createVehicleSchema.parse(request.body);

    const vehicle = await prisma.$transaction(async (tx) => {
      const v = await tx.vehicle.upsert({
        where: { vin: body.vin },
        update: {},
        create: {
          vin: body.vin,
          make: body.make,
          model: body.model,
          year: body.year,
          engine: body.engine ?? null,
          plate: body.plate ?? null,
          mileageKm: body.mileageKm ?? null,
        },
      });

      await tx.ownership.create({
        data: { vehicleId: v.id, userId: request.user.sub, role: "owner" },
      });

      return v;
    });

    return reply.code(201).send(vehicle);
  });
}
