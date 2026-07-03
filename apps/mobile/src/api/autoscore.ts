// AutoScore 2.0 — a transparent 0–100 condition index computed on the fly from the vehicle's data
// (wear, maintenance, documents, cost trend), so every vehicle gets a rich, explainable score.
import type { DocumentDTO, VehicleDTO, VehicleEventDTO } from "./client";
import { maintenanceCost } from "./dashboard";

type T = (key: string, opts?: Record<string, unknown>) => string;

export interface AutoScoreFactor {
  key: string;
  label: string;
  weight: number;
  score: number; // 0–100
  detail: string;
}

export interface AutoScoreResult {
  score: number;
  factors: AutoScoreFactor[];
  verdict: string;
  tone: "success" | "warning" | "danger";
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function oilInterval(engine: string | null): number {
  const e = (engine ?? "").toLowerCase();
  if (e.includes("tdi") || e.includes("diesel")) return 20000;
  if (e.includes("hybrid")) return 12000;
  return 15000;
}

function lastMileage(events: VehicleEventDTO[], category: string): number | null {
  const ev = events
    .filter((e) => (e.type === "maintenance" || e.type === "repair") && e.payload?.category === category)
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))[0];
  return ev?.mileageKm ?? null;
}

function docDays(documents: DocumentDTO[], type: string): number | null {
  const d = documents.find((x) => x.type === type);
  if (!d?.expiresAt) return null;
  return Math.ceil((+new Date(d.expiresAt) - Date.now()) / 86_400_000);
}

export function computeAutoScore(
  vehicle: VehicleDTO,
  events: VehicleEventDTO[],
  documents: DocumentDTO[],
  t: T,
): AutoScoreResult {
  const mileage = vehicle.mileageKm ?? 0;
  const eur = (n: number) => `${Math.round(n).toLocaleString("de-DE")} €`;

  // 1) Wear — driven by total mileage (≈ 300k km → 0).
  const wearScore = clamp(100 - mileage / 3000);
  const wear: AutoScoreFactor = {
    key: "wear",
    label: t("autoscore.wear"),
    weight: 0.25,
    score: wearScore,
    detail: t("autoscore.wearDetail", { km: mileage.toLocaleString("de-DE") }),
  };

  // 2) Maintenance — how far past the oil-change interval.
  const interval = oilInterval(vehicle.engine);
  const lastOil = lastMileage(events, "oil") ?? lastMileage(events, "inspection");
  let maintScore: number;
  let maintDetail: string;
  if (lastOil == null) {
    maintScore = 55;
    maintDetail = t("autoscore.maintUnknown");
  } else {
    const overdue = mileage - (lastOil + interval);
    maintScore = clamp(overdue <= 0 ? 100 - (interval + overdue) / (interval / 40) : 60 - overdue / 200);
    maintDetail = overdue <= 0 ? t("autoscore.maintOk") : t("autoscore.maintDue");
  }
  const maintenance: AutoScoreFactor = {
    key: "maintenance",
    label: t("autoscore.maintenance"),
    weight: 0.3,
    score: maintScore,
    detail: maintDetail,
  };

  // 3) Documents — TÜV + insurance validity.
  const tuvDays = docDays(documents, "tuv");
  const insDays = docDays(documents, "insurance");
  const rate = (days: number | null, missing: number) => {
    if (days == null) return -missing;
    if (days < 0) return -50;
    if (days < 30) return -20;
    return 0;
  };
  const docsScore = clamp(100 + rate(tuvDays, 30) + rate(insDays, 25));
  const documentsFactor: AutoScoreFactor = {
    key: "documents",
    label: t("autoscore.documents"),
    weight: 0.2,
    score: docsScore,
    detail: docsScore >= 90 ? t("autoscore.docsOk") : t("autoscore.docsIssue"),
  };

  // 4) Costs — repair spend over the last 12 months relative to distance driven.
  const yearAgo = Date.now() - 365 * 86_400_000;
  const recent = events.filter((e) => +new Date(e.occurredAt) >= yearAgo);
  const repairYear = recent
    .filter((e) => e.type === "maintenance" || e.type === "repair")
    .reduce((s, e) => s + maintenanceCost((e.payload ?? {}) as Record<string, unknown>), 0);
  const costScore = clamp(100 - repairYear / 30); // 3000 €/yr → 0
  const costs: AutoScoreFactor = {
    key: "costs",
    label: t("autoscore.costs"),
    weight: 0.25,
    score: costScore,
    detail: t("autoscore.costLevel", { eur: eur(repairYear) }),
  };

  const factors = [wear, maintenance, documentsFactor, costs];
  const total = factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0) / total);
  const tone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  const verdict =
    score >= 80 ? t("autoscore.verdictExcellent") : score >= 60 ? t("autoscore.verdictGood") : t("autoscore.verdictAttention");

  return { score, factors, verdict, tone };
}
