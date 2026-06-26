import type { SaleReportSnapshot } from "./sale-report";

function esc(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

function typeLabel(type: string): string {
  if (type === "maintenance") return "Service";
  if (type === "repair") return "Repair";
  if (type === "scan") return "Diagnostics";
  if (type === "incident") return "Incident";
  return type;
}

const STYLES = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0B0F14; color: #F5F7FA;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 24px 20px 48px; }
  .brand { display: flex; align-items: center; gap: 8px; color: #9AA7B4; font-size: 13px; letter-spacing: 2px;
    text-transform: uppercase; margin-bottom: 20px; }
  .brand b { color: #2E7DF6; }
  .hero { display: flex; justify-content: space-between; align-items: center; gap: 16px;
    background: #151B23; border: 1px solid #222B36; border-radius: 16px; padding: 24px; }
  h1 { margin: 0 0 6px; font-size: 26px; }
  h1 span { color: #9AA7B4; font-weight: 400; }
  .vin { color: #9AA7B4; font-size: 13px; letter-spacing: 1px; }
  .specs { color: #F5F7FA; margin-top: 8px; font-size: 15px; }
  .score { width: 116px; height: 116px; flex: none; border-radius: 50%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; border: 6px solid var(--c); }
  .score-num { font-size: 40px; font-weight: 700; color: var(--c); line-height: 1; }
  .score-label { font-size: 11px; color: #9AA7B4; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
  .card { background: #151B23; border: 1px solid #222B36; border-radius: 16px; padding: 20px 24px; margin-top: 16px; }
  .card h2 { margin: 0 0 16px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: #9AA7B4; }
  .factor { display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 14px; }
  .bar { background: #0B0F14; border-radius: 999px; height: 10px; overflow: hidden; }
  .fill { height: 100%; border-radius: 999px; }
  ul.timeline { list-style: none; margin: 0; padding: 0; }
  ul.timeline li { display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid #222B36; }
  ul.timeline li:first-child { border-top: none; }
  .t-type { flex: none; width: 92px; font-size: 12px; color: #2E7DF6; text-transform: uppercase; letter-spacing: 1px; padding-top: 2px; }
  .t-type.scan { color: #F59E0B; }
  .t-summary { font-size: 15px; }
  .t-meta { color: #9AA7B4; font-size: 13px; margin-top: 2px; }
  .empty { color: #9AA7B4; }
  footer { color: #6B7785; font-size: 12px; margin-top: 28px; text-align: center; line-height: 1.6; }
`;

export function renderReportHtml(snapshot: SaleReportSnapshot): string {
  const v = snapshot.vehicle;
  const score = snapshot.autoScore?.score ?? null;
  const color = score != null ? scoreColor(score) : "#9AA7B4";
  const factors = snapshot.autoScore?.factors ?? [];

  const factorRows = factors
    .map(
      (f) => `<div class="factor"><span>${esc(f.label)}</span>
        <div class="bar"><div class="fill" style="width:${Math.round(f.score)}%;background:${scoreColor(f.score)}"></div></div></div>`,
    )
    .join("");

  const timelineRows = snapshot.timeline
    .map(
      (e) => `<li><div class="t-type ${esc(e.type)}">${esc(typeLabel(e.type))}</div>
        <div class="t-body"><div class="t-summary">${esc(e.summary)}</div>
        <div class="t-meta">${esc(new Date(e.occurredAt).toLocaleDateString())}${
          e.mileageKm != null ? ` · ${esc(e.mileageKm.toLocaleString())} km` : ""
        }</div></div></li>`,
    )
    .join("");

  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(v.make)} ${esc(v.model)} ${esc(v.year)} — AutoLife report</title>
<style>${STYLES}</style>
</head><body><div class="wrap">
  <div class="brand"><b>AutoLife</b> · Vehicle report</div>
  <section class="hero">
    <div>
      <h1>${esc(v.make)} ${esc(v.model)} <span>${esc(v.year)}</span></h1>
      <div class="vin">VIN ${esc(v.vin)}</div>
      <div class="specs">${v.engine ? esc(v.engine) + " · " : ""}${
        v.mileageKm != null ? esc(v.mileageKm.toLocaleString()) + " km" : "mileage n/a"
      }</div>
    </div>
    <div class="score" style="--c:${color}">
      <div class="score-num">${score ?? "—"}</div>
      <div class="score-label">AutoScore</div>
    </div>
  </section>
  ${factors.length ? `<section class="card"><h2>Condition breakdown</h2>${factorRows}</section>` : ""}
  <section class="card"><h2>Service &amp; diagnostics history</h2>
    <ul class="timeline">${timelineRows || '<li class="empty">No public records yet</li>'}</ul></section>
  <footer>Generated ${esc(new Date(snapshot.generatedAt).toLocaleString())}<br/>
    Shared via AutoLife — this is the car's CarDNA record. No owner personal data is included.</footer>
</div></body></html>`;
}

export function notFoundHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Report not found</title>
<style>${STYLES}</style></head><body><div class="wrap">
  <div class="brand"><b>AutoLife</b></div>
  <section class="hero"><div><h1>Report not found</h1>
  <div class="specs">This sale report link is invalid or has expired.</div></div></section>
</div></body></html>`;
}
