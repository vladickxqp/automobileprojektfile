import type { SaleReportSnapshot } from "./sale-report";

function esc(value: unknown): string {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "#2FB47C";
  if (score >= 60) return "#E8A13C";
  return "#E5484D";
}

function typeLabel(type: string): string {
  if (type === "maintenance") return "Service";
  if (type === "repair") return "Repair";
  if (type === "scan") return "Diagnostics";
  if (type === "incident") return "Incident";
  return type;
}

const CAR_SVG = `<svg viewBox="0 0 280 120" width="100%" height="116" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:360px;display:block;margin:0 auto">
  <line x1="30" y1="96" x2="262" y2="96" stroke="#23262B" stroke-width="2"/>
  <path d="M20,86 C16,73 28,68 44,66 L102,40 C118,31 146,28 174,30 L212,37 C240,42 258,56 264,82" stroke="#F2552A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="44" y1="86" x2="262" y2="86" stroke="#8A9099" stroke-width="2" opacity="0.6"/>
  <path d="M80,48 L106,34 L152,33 L160,50" stroke="#8A9099" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="128" y1="33" x2="130" y2="50" stroke="#8A9099" stroke-width="1.5" opacity="0.7"/>
  <circle cx="86" cy="92" r="19" stroke="#F2F3F5" stroke-width="3"/>
  <circle cx="86" cy="92" r="7" stroke="#F2552A" stroke-width="2.5"/>
  <circle cx="208" cy="92" r="19" stroke="#F2F3F5" stroke-width="3"/>
  <circle cx="208" cy="92" r="7" stroke="#F2552A" stroke-width="2.5"/>
</svg>`;

const STYLES = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #08090A; color: #F2F3F5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 26px 18px 56px; }
  .brand { display: flex; align-items: center; gap: 10px; color: #8A9099; font-size: 12px; letter-spacing: 3px;
    text-transform: uppercase; margin-bottom: 18px; }
  .brand b { color: #F2552A; font-weight: 800; }
  .carwrap { padding: 6px 0 18px; }
  .hero { display: flex; justify-content: space-between; align-items: center; gap: 16px;
    background: #111315; border: 1px solid #23262B; border-radius: 8px; padding: 22px; }
  h1 { margin: 0 0 6px; font-size: 26px; font-weight: 800; }
  h1 span { color: #8A9099; font-weight: 400; }
  .vin { color: #8A9099; font-size: 13px; letter-spacing: 1px; }
  .specs { color: #F2F3F5; margin-top: 8px; font-size: 15px; }
  .score { width: 112px; height: 112px; flex: none; border-radius: 50%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; border: 5px solid var(--c); }
  .score-num { font-size: 40px; font-weight: 800; color: var(--c); line-height: 1; }
  .score-label { font-size: 10px; color: #8A9099; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px; }
  .card { background: #111315; border: 1px solid #23262B; border-radius: 8px; padding: 20px 22px; margin-top: 14px; }
  .card h2 { margin: 0 0 16px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #8A9099; }
  .factor { display: grid; grid-template-columns: 168px 1fr; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 14px; }
  .bar { background: #08090A; border-radius: 3px; height: 8px; overflow: hidden; }
  .fill { height: 100%; border-radius: 3px; }
  ul.timeline { list-style: none; margin: 0; padding: 0; }
  ul.timeline li { display: flex; gap: 14px; padding: 13px 0; border-top: 1px solid #23262B; }
  ul.timeline li:first-child { border-top: none; }
  .t-type { flex: none; width: 92px; font-size: 11px; color: #8A9099; text-transform: uppercase; letter-spacing: 1px; padding-top: 3px; }
  .t-type.scan { color: #F2552A; }
  .t-summary { font-size: 15px; }
  .t-meta { color: #8A9099; font-size: 13px; margin-top: 2px; }
  .empty { color: #8A9099; }
  footer { color: #565C64; font-size: 12px; margin-top: 28px; text-align: center; line-height: 1.6; }
`;

export function renderReportHtml(snapshot: SaleReportSnapshot): string {
  const v = snapshot.vehicle;
  const score = snapshot.autoScore?.score ?? null;
  const color = score != null ? scoreColor(score) : "#8A9099";
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
  <div class="brand"><b>AUTOLIFE</b> · Vehicle report</div>
  <div class="carwrap">${CAR_SVG}</div>
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
  <div class="brand"><b>AUTOLIFE</b></div>
  <section class="hero"><div><h1>Report not found</h1>
  <div class="specs">This sale report link is invalid or has expired.</div></div></section>
</div></body></html>`;
}
