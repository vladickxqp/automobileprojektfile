import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";
import { ASSISTANT_ENABLED, askAssistant } from "../lib/anthropic";
import { retrieveKnowledge } from "../lib/knowledge";

const askSchema = z.object({ message: z.string().min(1).max(1000) });

export async function assistantRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.get("/:id/assistant/history", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    return prisma.aiMessage.findMany({ where: { vehicleId: id }, orderBy: { createdAt: "asc" } });
  });

  app.post("/:id/assistant", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    if (!ASSISTANT_ENABLED) {
      return reply
        .code(503)
        .send({ error: "Assistant is not configured (missing ANTHROPIC_API_KEY)" });
    }

    const { message } = askSchema.parse(request.body);

    const [vehicle, recentScans, history] = await Promise.all([
      prisma.vehicle.findUniqueOrThrow({ where: { id } }),
      prisma.diagnosticScan.findMany({
        where: { vehicleId: id },
        orderBy: { scannedAt: "desc" },
        take: 3,
      }),
      prisma.aiMessage.findMany({
        where: { vehicleId: id },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
    ]);

    const recentDtcCodes = [...new Set(recentScans.flatMap((s) => s.dtcCodes))];
    const knowledge = await retrieveKnowledge(`${message} ${recentDtcCodes.join(" ")}`);

    const answer = await askAssistant({
      vehicle,
      recentDtcCodes,
      knowledge,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      question: message,
    });

    const sources = knowledge.map((k) => ({ title: k.title, source: k.source }));

    await prisma.$transaction([
      prisma.aiMessage.create({ data: { vehicleId: id, role: "user", content: message } }),
      prisma.aiMessage.create({
        data: {
          vehicleId: id,
          role: "assistant",
          content: answer,
          sources: sources as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    return { answer, sources };
  });
}
