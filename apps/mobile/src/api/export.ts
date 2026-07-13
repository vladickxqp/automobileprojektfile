// Data export (Phase 7): build a printable HTML "vehicle life record" and a CSV/Excel table from a
// vehicle's data. Pure functions — the screen handles the platform-specific saving/sharing.
import type { AutoScoreResult } from "./autoscore";
import type { DocumentDTO, VehicleDTO, VehicleEventDTO } from "./client";
import { maintenanceCost } from "./dashboard";

type T = (key: string, opts?: Record<string, unknown>) => string;

const de = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("de-DE") : "");
const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// --- CSV ---
const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildEventsCsv(events: VehicleEventDTO[], t: T): string {
  const header = ["Datum", "Typ", t("addEvent.category"), "km", "EUR", "Liter", t("addEvent.workshop"), t("addEvent.description")];
  const rows = [...events]
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
    .map((e) => {
      const p = (e.payload ?? {}) as Record<string, unknown>;
      const amount = e.type === "maintenance" || e.type === "repair" ? maintenanceCost(p) : Number(p.amount) || 0;
      return [
        de(e.occurredAt),
        e.type,
        String(p.category ?? ""),
        e.mileageKm ?? "",
        amount || "",
        p.liters ?? "",
        String(p.workshop ?? p.shopName ?? (p.diy ? "DIY" : "")),
        String(p.notes ?? p.note ?? ""),
      ]
        .map(csvCell)
        .join(";");
    });
  // BOM so Excel detects UTF-8; CRLF line endings.
  return "﻿" + [header.map(csvCell).join(";"), ...rows].join("\r\n");
}

// --- PDF (HTML) ---
export function buildLifeRecordHtml(
  vehicle: VehicleDTO,
  events: VehicleEventDTO[],
  documents: DocumentDTO[],
  score: AutoScoreResult | null,
  t: T,
): string {
  const rowsHtml = [...events]
    .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
    .map((e) => {
      const p = (e.payload ?? {}) as Record<string, unknown>;
      const amount = e.type === "maintenance" || e.type === "repair" ? maintenanceCost(p) : Number(p.amount) || 0;
      return `<tr><td>${de(e.occurredAt)}</td><td>${esc(e.type)}</td><td>${esc(p.category ?? "")}</td><td class="r">${
        e.mileageKm != null ? e.mileageKm.toLocaleString("de-DE") + " km" : ""
      }</td><td class="r">${amount ? amount.toLocaleString("de-DE") + " €" : ""}</td></tr>`;
    })
    .join("");

  const docRows = documents
    .map(
      (d) =>
        `<tr><td>${esc(t(`documents.types.${d.type}`, { defaultValue: d.type }))}</td><td>${esc(d.title ?? "")}</td><td>${de(
          d.issuedAt,
        )}</td><td>${de(d.expiresAt)}</td></tr>`,
    )
    .join("");

  const scoreHtml = score
    ? `<div class="score">${score.score}<span> / 100 · ${esc(score.verdict)}</span></div>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    * { font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
    body { color: #191428; padding: 28px; }
    h1 { margin: 0 0 2px; font-size: 22px; }
    h2 { font-size: 14px; color: #6D4AE6; margin: 24px 0 8px; text-transform: uppercase; letter-spacing: .5px; }
    .sub { color: #615B7A; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 13px; }
    .grid b { color: #615B7A; font-weight: 600; }
    .score { font-size: 34px; font-weight: 800; color: #6D4AE6; }
    .score span { font-size: 14px; color: #615B7A; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #E6E0F7; }
    th { color: #615B7A; text-transform: uppercase; font-size: 10px; }
    td.r, th.r { text-align: right; }
    .foot { margin-top: 28px; color: #9A93B5; font-size: 11px; }
  </style></head><body>
    <h1>CarDNA — ${esc(vehicle.make)} ${esc(vehicle.model)}</h1>
    <div class="sub">${esc(t("export.title"))} · ${de(new Date().toISOString())}</div>
    ${scoreHtml}
    <h2>${esc(t("export.vehicle"))}</h2>
    <div class="grid">
      <div><b>${esc(t("dashboard.vin"))}:</b> ${esc(vehicle.vin)}</div>
      <div><b>${esc(t("dashboard.year"))}:</b> ${esc(vehicle.year)}</div>
      <div><b>${esc(t("dashboard.engine"))}:</b> ${esc(vehicle.engine ?? "")}</div>
      <div><b>${esc(t("dashboard.mileage"))}:</b> ${vehicle.mileageKm != null ? vehicle.mileageKm.toLocaleString("de-DE") + " km" : ""}</div>
    </div>
    <h2>${esc(t("history.title"))}</h2>
    <table><thead><tr><th>Datum</th><th>Typ</th><th>${esc(t("addEvent.category"))}</th><th class="r">km</th><th class="r">€</th></tr></thead>
    <tbody>${rowsHtml || `<tr><td colspan="5">—</td></tr>`}</tbody></table>
    <h2>${esc(t("dashboard.documents"))}</h2>
    <table><thead><tr><th>${esc(t("documents.typeLabel"))}</th><th>${esc(t("documents.title"))}</th><th>${esc(
      t("documents.issued"),
    )}</th><th>${esc(t("documents.validUntil"))}</th></tr></thead>
    <tbody>${docRows || `<tr><td colspan="4">—</td></tr>`}</tbody></table>
    <div class="foot">CarDNA</div>
  </body></html>`;
}
