import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";
import { decodeDtcCodes } from "../lib/dtc";

const dtcCode = z
  .string()
  .regex(/^[PCBU][0-9A-Fa-f]{4}$/, "Invalid DTC code")
  .transform((s) => s.toUpperCase());

const createScanSchema = z.object({
  dtcCodes: z.array(dtcCode).max(50),
  adapterInfo: z.string().max(120).optional(),
  mileageKm: z.number().int().nonnegative().optional(),
});

export async function scanRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.get("/:id/scans", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const scans = await prisma.diagnosticScan.findMany({
      where: { vehicleId: id },
      orderBy: { scannedAt: "desc" },
      take: 50,
    });
    return Promise.all(
      scans.map(async (scan) => ({ ...scan, decoded: await decodeDtcCodes(scan.dtcCodes) })),
    );
  });

  // Store an OBD-II read (#11) and mirror it onto the CarDNA timeline so it travels with the car.
  app.post("/:id/scans", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const body = createScanSchema.parse(request.body);

    const scan = await prisma.$transaction(async (tx) => {
      const created = await tx.diagnosticScan.create({
        data: {
          vehicleId: id,
          dtcCodes: body.dtcCodes,
          adapterInfo: body.adapterInfo ?? null,
          mileageKm: body.mileageKm ?? null,
        },
      });
      await tx.vehicleEvent.create({
        data: {
          vehicleId: id,
          type: "scan",
          occurredAt: created.scannedAt,
          mileageKm: body.mileageKm ?? null,
          visibility: "carDNA",
          payload: {
            dtcCodes: body.dtcCodes,
            adapterInfo: body.adapterInfo ?? null,
          } as Prisma.InputJsonValue,
          createdByUserId: request.user.sub,
        },
      });
      return created;
    });

    return reply.code(201).send({ ...scan, decoded: await decodeDtcCodes(scan.dtcCodes) });
  });
}
