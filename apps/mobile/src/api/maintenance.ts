// Rule-based maintenance recommendations derived from the vehicle data (engine/fuel, mileage) and
// its history + documents. Computed on the fly, so every vehicle automatically gets suggestions.
import type { DocumentDTO, VehicleDTO, VehicleEventDTO } from "./client";

export interface Recommendation {
  id: string;
  label: string;
  detail: string;
  severity: "info" | "warning" | "danger";
}

type T = (key: string, opts?: Record<string, unknown>) => string;

// Oil-change interval (km) depends roughly on the engine/fuel type.
function oilInterval(engine: string | null): number {
  const e = (engine ?? "").toLowerCase();
  if (e.includes("tdi") || e.includes("diesel")) return 20000;
  if (e.includes("hybrid")) return 12000;
  return 15000;
}

// Mileage of the most recent maintenance/repair event with a given category, or null.
function lastMileage(events: VehicleEventDTO[], category: string): number | null {
  const ev = events
    .filter((e) => (e.type === "maintenance" || e.type === "repair") && e.payload.category === category)
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
  return ev?.mileageKm ?? null;
}

export function computeRecommendations(
  vehicle: VehicleDTO,
  events: VehicleEventDTO[],
  documents: DocumentDTO[],
  t: T,
): Recommendation[] {
  const mileage = vehicle.mileageKm ?? 0;
  const recs: Recommendation[] = [];

  // Oil change — always shown (headline metric).
  const oilInt = oilInterval(vehicle.engine);
  const lastOil = lastMileage(events, "oil") ?? lastMileage(events, "inspection") ?? 0;
  const oilRemaining = lastOil + oilInt - mileage;
  recs.push({
    id: "oil",
    label: t("recommend.nextOil"),
    detail: oilRemaining <= 0 ? t("recommend.overdue") : t("recommend.inKm", { km: oilRemaining.toLocaleString("de-DE") }),
    severity: oilRemaining <= 0 ? "danger" : oilRemaining <= 2000 ? "warning" : "info",
  });

  // Brake check ~ every 30.000 km.
  const lastBrakes = lastMileage(events, "brakes");
  const brakeInt = 30000;
  const brakeDue = lastBrakes == null ? mileage >= brakeInt : mileage - lastBrakes >= brakeInt;
  if (brakeDue) recs.push({ id: "brakes", label: t("recommend.checkBrakes"), detail: "", severity: "warning" });

  // TÜV / HU expiry from documents.
  const tuv = documents.find((d) => d.type === "tuv");
  if (tuv?.expiresAt) {
    const days = Math.ceil((+new Date(tuv.expiresAt) - Date.now()) / 86_400_000);
    if (days < 0) {
      recs.push({ id: "tuv", label: t("recommend.tuvExpires"), detail: t("recommend.overdue"), severity: "danger" });
    } else if (days <= 120) {
      const months = Math.round(days / 30);
      const detail = months >= 1 ? t("recommend.inMonths", { count: months }) : t("common.inDays", { count: days });
      recs.push({ id: "tuv", label: t("recommend.tuvExpires"), detail, severity: "warning" });
    }
  }

  // Service inspection ~ every 20.000 km.
  const lastInsp = lastMileage(events, "inspection");
  const inspInt = 20000;
  const inspDue = lastInsp == null ? mileage >= inspInt : mileage - lastInsp >= inspInt;
  if (inspDue) recs.push({ id: "inspection", label: t("recommend.inspection"), detail: "", severity: "info" });

  return recs;
}
