import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "./prisma";

/** Adds a preHandler that rejects unauthenticated requests for every route in the plugin. */
export function registerAuthGuard(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
}

/**
 * Confirms the current user actively owns the vehicle. Replies 404 and returns false otherwise —
 * access always flows through Ownership, never a direct user FK (the CarDNA indirection).
 */
export async function requireVehicleAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  vehicleId: string,
): Promise<boolean> {
  const ownership = await prisma.ownership.findFirst({
    where: { vehicleId, userId: request.user.sub, to: null },
  });
  if (!ownership) {
    await reply.code(404).send({ error: "Vehicle not found" });
    return false;
  }
  return true;
}
