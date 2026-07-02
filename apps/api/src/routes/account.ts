import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { registerAuthGuard } from "../lib/guards";

// Permanently delete the signed-in user and everything they own. Required by the App Store and
// Play Store. Deleting the user's vehicles cascades their events, documents, scans, scores,
// reminders, sale reports, AI messages and ownership rows (see schema onDelete: Cascade); the
// user row is then removed.
export async function accountRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.delete("/", async (request) => {
    const userId = request.user.sub;
    await prisma.$transaction(async (tx) => {
      const ownerships = await tx.ownership.findMany({ where: { userId } });
      const vehicleIds = [...new Set(ownerships.map((o) => o.vehicleId))];
      if (vehicleIds.length > 0) {
        await tx.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
      }
      await tx.user.delete({ where: { id: userId } });
    });
    return { ok: true };
  });
}
