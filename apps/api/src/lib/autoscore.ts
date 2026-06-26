import type { AutoScoreFactor } from "@autolife/shared";
import { prisma } from "./prisma";

export interface ComputedScore {
  score: number;
  factors: AutoScoreFactor[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * AutoScore (#13): a transparent 1-100 condition index. MVP is rule-based over the data we have
 * (age, mileage, service history, open DTCs, record completeness). In V4 this becomes ML-backed
 * once enough VehicleEvents have accumulated — the factor breakdown stays the public contract.
 */
export async function computeAutoScore(vehicleId: string): Promise<ComputedScore> {
  const [vehicle, maintenanceEvents, scans] = await Promise.all([
    prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } }),
    prisma.vehicleEvent.findMany({
      where: { vehicleId, type: { in: ["maintenance", "repair"] } },
    }),
    prisma.diagnosticScan.findMany({
      where: { vehicleId },
      orderBy: { scannedAt: "desc" },
      take: 5,
    }),
  ]);

  const age = Math.max(0, new Date().getFullYear() - vehicle.year);
  const ageScore = clamp(100 - age * 4, 10, 100);

  const mileage = vehicle.mileageKm ?? 150000;
  const mileageScore = clamp(100 - mileage / 3000, 10, 100);

  const maintenanceScore = clamp(40 + maintenanceEvents.length * 12, 20, 100);

  const latestCodes = scans[0]?.dtcCodes ?? [];
  const refs = latestCodes.length
    ? await prisma.dtcCodeRef.findMany({ where: { code: { in: latestCodes } } })
    : [];
  const knownSeverity = refs.reduce((sum, r) => sum + (r.severity ?? 2), 0);
  const unknownSeverity = (latestCodes.length - refs.length) * 2;
  const diagnosticsScore = clamp(100 - (knownSeverity + unknownSeverity) * 12, 10, 100);

  const recordCount = maintenanceEvents.length + scans.length;
  const historyScore = clamp(30 + recordCount * 10, 20, 100);

  const factors: AutoScoreFactor[] = [
    { key: "maintenance", label: "Maintenance history", weight: 0.3, score: maintenanceScore },
    { key: "diagnostics", label: "Diagnostics", weight: 0.25, score: diagnosticsScore },
    { key: "mileage", label: "Mileage", weight: 0.2, score: mileageScore },
    { key: "age", label: "Age", weight: 0.15, score: ageScore },
    { key: "history", label: "Record completeness", weight: 0.1, score: historyScore },
  ];

  const weighted = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return { score: clamp(Math.round(weighted), 1, 100), factors };
}
