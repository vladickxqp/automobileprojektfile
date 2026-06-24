import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { decodeVin, vinSchema } from "@autolife/shared";
import { prisma } from "../lib/prisma";
import { enrichFromNhtsa } from "../lib/vin-enrich";

const createVehicleSchema = z.object({
  vin: vinSchema,
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1900).max(2100),
  engine: z.string().max(120).optional(),
  plate: z.string().max(20).optional(),
  mileageKm: z.number().int().nonnegative().optional(),
});

const updateVehicleSchema = z.object({
  mileageKm: z.number().int().nonnegative().optional(),
  plate: z.string().max(20).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
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

  // Returns the current owner's active ownership of a vehicle, or null. This is the single
  // gate for access — a car is reachable only through Ownership, never a direct user FK.
  const activeOwnership = (userId: string, vehicleId: string) =>
    prisma.ownership.findFirst({ where: { vehicleId, userId, to: null } });

  // Decode a VIN to pre-fill the "add car" form (#4). Offline decoder + best-effort NHTSA.
  app.get("/decode/:vin", async (request, reply) => {
    const parsed = vinSchema.safeParse((request.params as { vin: string }).vin);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid VIN" });
    }
    const local = decodeVin(parsed.data);
    const enriched = await enrichFromNhtsa(parsed.data);

    return {
      vin: local.vin,
      year: enriched?.year ?? local.modelYear,
      make: enriched?.make ?? local.manufacturer,
      model: enriched?.model ?? null,
      engine: enriched?.engine ?? null,
      country: local.country,
      source: enriched ? "nhtsa+local" : "local",
    };
  });

  // List the current user's vehicles, reached through Ownership (the CarDNA indirection).
  app.get("/", async (request) => {
    const ownerships = await prisma.ownership.findMany({
      where: { userId: request.user.sub, to: null },
      include: { vehicle: true },
      orderBy: { from: "desc" },
    });
    return ownerships.map((o) => o.vehicle);
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const ownership = await activeOwnership(request.user.sub, id);
    if (!ownership) {
      return reply.code(404).send({ error: "Vehicle not found" });
    }
    return prisma.vehicle.findUniqueOrThrow({ where: { id } });
  });

  // Add a vehicle (by VIN) and open the current-owner Ownership in one transaction.
  // upsert on VIN: if the car already exists in the system, attach a new owner to its history.
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

  app.patch("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateVehicleSchema.parse(request.body);

    const ownership = await activeOwnership(request.user.sub, id);
    if (!ownership) {
      return reply.code(404).send({ error: "Vehicle not found" });
    }

    return prisma.vehicle.update({ where: { id }, data: body });
  });
}
