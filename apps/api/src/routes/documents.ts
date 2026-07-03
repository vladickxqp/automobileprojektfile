import { randomUUID } from "node:crypto";
import path from "node:path";
import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { documentTypeSchema, paymentIntervalSchema } from "@autolife/shared";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";
import { storage } from "../lib/storage";

// Multipart fields arrive as strings, so numbers/dates are coerced here. Structured, type-specific
// fields (Documents 2.0) are folded into the `meta` JSON column.
const uploadFieldsSchema = z.object({
  type: documentTypeSchema,
  title: z.string().max(160).optional(),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  insurer: z.string().max(120).optional(),
  policyNumber: z.string().max(80).optional(),
  premium: z.coerce.number().nonnegative().optional(),
  interval: paymentIntervalSchema.optional(),
  paymentDate: z.coerce.date().optional(),
  amount: z.coerce.number().nonnegative().optional(),
  debitDate: z.coerce.date().optional(),
  dealer: z.string().max(120).optional(),
  scope: z.string().max(500).optional(),
});

function buildMeta(f: z.infer<typeof uploadFieldsSchema>): Prisma.InputJsonValue | undefined {
  const m: Record<string, unknown> = {};
  if (f.insurer) m.insurer = f.insurer;
  if (f.policyNumber) m.policyNumber = f.policyNumber;
  if (f.premium !== undefined) m.premium = f.premium;
  if (f.interval) m.interval = f.interval;
  if (f.paymentDate) m.paymentDate = f.paymentDate.toISOString();
  if (f.amount !== undefined) m.amount = f.amount;
  if (f.debitDate) m.debitDate = f.debitDate.toISOString();
  if (f.dealer) m.dealer = f.dealer;
  if (f.scope) m.scope = f.scope;
  return Object.keys(m).length ? (m as Prisma.InputJsonValue) : undefined;
}

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
    // Drop blank multipart fields so optional numbers/dates don't fail coercion.
    const clean = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== ""));
    const parsed = uploadFieldsSchema.parse(clean);
    const metaJson = buildMeta(parsed);

    const key = path.join(id, `${randomUUID()}${path.extname(originalName)}`);
    const fileUrl = await storage.save(key, fileBuffer);

    const document = await prisma.document.create({
      data: {
        vehicleId: id,
        type: parsed.type,
        fileUrl,
        title: parsed.title ?? null,
        issuedAt: parsed.issuedAt ?? null,
        expiresAt: parsed.expiresAt ?? null,
        ...(metaJson !== undefined ? { meta: metaJson } : {}),
      },
    });
    return reply.code(201).send(document);
  });
}
