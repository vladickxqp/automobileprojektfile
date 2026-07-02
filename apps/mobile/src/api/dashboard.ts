// Per-vehicle dashboard statistics, derived on the fly from the vehicle's events so every car
// automatically has its own dashboard. Works the same against demo data and the real backend.
import type { VehicleDTO, VehicleEventDTO } from "./client";

export type DashboardPeriod = "month" | "sixMonths" | "year";

export interface DashboardStats {
  period: DashboardPeriod;
  monthsElapsed: number;
  kmDriven: number | null;
  avgKmPerMonth: number | null;
  fuelCost: number;
  repairCost: number;
  otherCost: number;
  totalCost: number;
  costPerKm: number | null;
  litersTotal: number;
  avgConsumption: number | null; // litres per 100 km
  fuelCount: number;
  repairCount: number;
  otherCount: number;
}

export function periodStart(period: DashboardPeriod, ref: Date = new Date()): Date {
  if (period === "month") return new Date(ref.getFullYear(), ref.getMonth(), 1);
  if (period === "year") return new Date(ref.getFullYear(), 0, 1);
  // last 6 months → first day of the month 5 months ago (covers 6 calendar months incl. current)
  return new Date(ref.getFullYear(), ref.getMonth() - 5, 1);
}

// Cost of a maintenance / repair event, tolerant of both payload shapes:
// the newer { cost } and the older { partsCost, laborCost }.
export function maintenanceCost(p: Record<string, unknown>): number {
  if (typeof p.cost === "number") return p.cost;
  return (Number(p.partsCost) || 0) + (Number(p.laborCost) || 0);
}

export function isFuelCategory(category: string): boolean {
  const c = category.toLowerCase();
  return c === "fuel" || c === "kraftstoff" || c === "benzin" || c === "diesel";
}

export type CostCategory = "fuel" | "repair" | "other" | "total";

// A single line item behind a dashboard cost tile. Raw fields are returned so the screen can
// localise and format them.
export interface CostEntry {
  id: string;
  type: VehicleEventDTO["type"];
  group: "fuel" | "repair" | "other";
  date: string;
  amount: number;
  mileageKm: number | null;
  title: string | null;
  category: string | null;
  note: string | null;
  workshop: string | null;
  diy: boolean;
}

function groupOf(e: VehicleEventDTO): "fuel" | "repair" | "other" | null {
  if (e.type === "maintenance" || e.type === "repair") return "repair";
  if (e.type === "expense") return isFuelCategory(String(e.payload?.category ?? "")) ? "fuel" : "other";
  return null;
}

// Detailed, newest-first breakdown for one cost tile within the selected period.
export function listCostEntries(
  events: VehicleEventDTO[],
  period: DashboardPeriod,
  category: CostCategory,
  ref: Date = new Date(),
): CostEntry[] {
  const startMs = +periodStart(period, ref);
  const out: CostEntry[] = [];
  for (const e of events) {
    if (+new Date(e.occurredAt) < startMs) continue;
    const group = groupOf(e);
    if (!group) continue;
    if (category !== "total" && group !== category) continue;
    const p = (e.payload ?? {}) as Record<string, unknown>;
    const amount = group === "repair" ? maintenanceCost(p) : Number(p.amount) || 0;
    out.push({
      id: e.id,
      type: e.type,
      group,
      date: e.occurredAt,
      amount,
      mileageKm: e.mileageKm,
      title: typeof p.title === "string" ? p.title : null,
      category: typeof p.category === "string" ? p.category : null,
      note: typeof p.note === "string" ? p.note : typeof p.notes === "string" ? p.notes : null,
      workshop: typeof p.workshop === "string" ? p.workshop : typeof p.shopName === "string" ? p.shopName : null,
      diy: Boolean(p.diy),
    });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function computeDashboard(
  vehicle: VehicleDTO,
  events: VehicleEventDTO[],
  period: DashboardPeriod,
  ref: Date = new Date(),
): DashboardStats {
  const start = periodStart(period, ref);
  const startMs = +start;
  const inPeriod = events.filter((e) => +new Date(e.occurredAt) >= startMs);

  let fuelCost = 0;
  let otherCost = 0;
  let repairCost = 0;
  let fuelCount = 0;
  let otherCount = 0;
  let repairCount = 0;
  let litersTotal = 0;

  for (const e of inPeriod) {
    const p = e.payload ?? {};
    if (e.type === "maintenance" || e.type === "repair") {
      repairCost += maintenanceCost(p);
      repairCount += 1;
    } else if (e.type === "expense") {
      const amount = Number(p.amount) || 0;
      if (isFuelCategory(String(p.category ?? ""))) {
        fuelCost += amount;
        fuelCount += 1;
        litersTotal += Number(p.liters) || 0;
      } else {
        otherCost += amount;
        otherCount += 1;
      }
    }
  }

  const totalCost = fuelCost + repairCost + otherCost;

  // Kilometers driven: odometer delta between the period start and now, from the readings that
  // events carry. Fall back gracefully when there aren't enough readings.
  const readings = events
    .filter((e) => e.mileageKm != null)
    .map((e) => ({ t: +new Date(e.occurredAt), km: e.mileageKm as number }))
    .sort((a, b) => a.t - b.t);

  const endKm =
    vehicle.mileageKm != null ? vehicle.mileageKm : readings.length ? readings[readings.length - 1].km : null;

  let startKm: number | null = null;
  const before = readings.filter((r) => r.t < startMs);
  if (before.length) startKm = before[before.length - 1].km;
  else if (readings.length) startKm = readings[0].km;

  const kmDriven =
    endKm != null && startKm != null && endKm >= startKm ? endKm - startKm : null;

  const monthsElapsed =
    (ref.getFullYear() - start.getFullYear()) * 12 + (ref.getMonth() - start.getMonth()) + 1;
  const avgKmPerMonth = kmDriven != null && monthsElapsed > 0 ? Math.round(kmDriven / monthsElapsed) : null;
  const costPerKm = kmDriven && kmDriven > 0 ? totalCost / kmDriven : null;
  // l/100 km — needs both a distance and at least one refuel with litres logged.
  const avgConsumption = kmDriven && kmDriven > 0 && litersTotal > 0 ? (litersTotal / kmDriven) * 100 : null;

  return {
    period,
    monthsElapsed,
    kmDriven,
    avgKmPerMonth,
    fuelCost,
    repairCost,
    otherCost,
    totalCost,
    costPerKm,
    litersTotal,
    avgConsumption,
    fuelCount,
    repairCount,
    otherCount,
  };
}
