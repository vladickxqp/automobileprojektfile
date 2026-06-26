import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { registerAuthGuard, requireVehicleAccess } from "../lib/guards";
import { buildSaleReportSnapshot, type SaleReportSnapshot } from "../lib/sale-report";
import { notFoundHtml, renderReportHtml } from "../lib/report-html";

const REPORT_TTL_DAYS = 90;

// Authed: generate a sale report (#14) — a curated snapshot of the carDNA layer behind a public slug.
export async function saleReportRoutes(app: FastifyInstance) {
  registerAuthGuard(app);

  app.post("/:id/sale-report", async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!(await requireVehicleAccess(request, reply, id))) return;

    const snapshot = await buildSaleReportSnapshot(id);
    const slug = randomBytes(8).toString("hex");
    const expiresAt = new Date(Date.now() + REPORT_TTL_DAYS * 24 * 60 * 60 * 1000);

    const report = await prisma.saleReport.create({
      data: {
        vehicleId: id,
        publicSlug: slug,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return reply.code(201).send({ id: report.id, slug, url: `/r/${slug}`, expiresAt });
  });
}

// Public (no auth): the shareable page the buyer opens.
export async function publicReportRoutes(app: FastifyInstance) {
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const report = await prisma.saleReport.findUnique({ where: { publicSlug: slug } });

    if (!report || (report.expiresAt && report.expiresAt < new Date())) {
      return reply.code(404).type("text/html").send(notFoundHtml());
    }
    return reply.type("text/html").send(renderReportHtml(report.snapshot as unknown as SaleReportSnapshot));
  });
}
