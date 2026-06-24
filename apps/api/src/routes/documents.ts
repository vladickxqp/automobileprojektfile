import { randomUUID } from "node:crypto";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { documentTypeSchema } from "@autolife/shared";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";
import { storage } from "../lib/storage";

const metaSchema = z.object({
  type: documentTypeSchema,
  title: z.string().max(160).optional(),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export async function documentRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.get("/:id/documents", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;
    return prisma.document.findMany({ where: { vehicleId: id }, orderBy: { createdAt: "desc" } });
  });

  // Multipart upload (#7): one file part + metadata fields. Stored via StorageService.
  app.post("/:id/documents", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;

    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let originalName = "file";

    for await (const part of request.parts()) {
      if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        originalName = part.filename ?? "file";
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }

    if (!fileBuffer) return reply.code(400).send({ error: "Missing file" });
    const meta = metaSchema.parse(fields);

    const key = path.join(id, `${randomUUID()}${path.extname(originalName)}`);
    const fileUrl = await storage.save(key, fileBuffer);

    const document = await prisma.document.create({
      data: {
        vehicleId: id,
        type: meta.type,
        fileUrl,
        title: meta.title ?? null,
        issuedAt: meta.issuedAt ?? null,
        expiresAt: meta.expiresAt ?? null,
      },
    });
    return reply.code(201).send(document);
  });
}
