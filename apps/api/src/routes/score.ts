import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";
import { computeAutoScore } from "../lib/autoscore";

export async function scoreRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.get("/:id/score", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const latest = await prisma.reliabilityScore.findFirst({
      where: { vehicleId: id },
      orderBy: { computedAt: "desc" },
    });
    if (!latest) return reply.code(404).send({ error: "No score yet" });
    return latest;
  });

  // Recompute and store the AutoScore (#13).
  app.post("/:id/score", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    const { score, factors } = await computeAutoScore(id);
    const created = await prisma.reliabilityScore.create({
      data: { vehicleId: id, score, factors: factors as unknown as Prisma.InputJsonValue },
    });
    return reply.code(201).send(created);
  });
}
