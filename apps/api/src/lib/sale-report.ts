import { prisma } from "./prisma";

export interface SaleReportTimelineItem {
  type: string;
  occurredAt: string;
  mileageKm: number | null;
  summary: string;
}

export interface SaleReportSnapshot {
  vehicle: {
    make: string;
    model: string;
    year: number;
    vin: string;
    mileageKm: number | null;
    engine: string | null;
  };
  autoScore: { score: number; factors: { label: string; score: number }[] } | null;
  timeline: SaleReportTimelineItem[];
  generatedAt: string;
}

function summarize(type: string, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  if (type === "scan") {
    const codes = Array.isArray(p.dtcCodes) ? (p.dtcCodes as unknown[]).join(", ") : "";
    return codes ? `OBD-II scan: ${codes}` : "OBD-II scan: no fault codes";
  }
  if (type === "maintenance" || type === "repair") return String(p.title ?? type);
  return type;
}

/**
 * Build the buyer-facing snapshot for a sale report (#14). Only the carDNA layer is included —
 * private documents, expenses and personal data never appear here.
 */
export async function buildSaleReportSnapshot(vehicleId: string): Promise<SaleReportSnapshot> {
  const [vehicle, events, score] = await Promise.all([
    prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } }),
    prisma.vehicleEvent.findMany({
      where: { vehicleId, visibility: "carDNA" },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.reliabilityScore.findFirst({
      where: { vehicleId },
      orderBy: { computedAt: "desc" },
    }),
  ]);

  const factors = Array.isArray(score?.factors)
    ? (score.factors as Array<{ label?: unknown; score?: unknown }>).map((f) => ({
        label: String(f.label ?? ""),
        score: Number(f.score ?? 0),
      }))
    : [];

  return {
    vehicle: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      mileageKm: vehicle.mileageKm,
      engine: vehicle.engine,
    },
    autoScore: score ? { score: score.score, factors } : null,
    timeline: events.map((e) => ({
      type: e.type,
      occurredAt: e.occurredAt.toISOString(),
      mileageKm: e.mileageKm,
      summary: summarize(e.type, e.payload),
    })),
    generatedAt: new Date().toISOString(),
  };
}
