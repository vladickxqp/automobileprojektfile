// Real fuel prices per station from free national open-data feeds.
//   FR — data.economie.gouv.fr (Opendatasoft, key-less, CORS *) — works in-browser.
//   DE — Tankerkönig (free API key via EXPO_PUBLIC_TANKERKOENIG_KEY) — attribution "© Tankerkönig".
// ES/IT are bulky / lack CORS → best served via the backend proxy (added later).
// Country is picked from the location's bounding box; returns [] where no provider applies.

export interface FuelStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  diesel: number | null;
  e5: number | null;
  e10: number | null;
  isOpen?: boolean;
  source: "FR" | "DE";
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

function countryOf(lat: number, lon: number): "fr" | "de" | null {
  if (lat >= 47.2 && lat <= 55.1 && lon >= 5.8 && lon <= 15.1) return "de";
  if (lat >= 41 && lat <= 51.5 && lon >= -5.5 && lon <= 9.8) return "fr";
  return null;
}

interface FrRecord {
  id: number;
  geom?: { lat: number; lon: number };
  ville?: string;
  adresse?: string;
  gazole_prix?: string | number;
  e10_prix?: string | number;
  sp95_prix?: string | number;
}

async function fetchFrance(lat: number, lon: number, radiusKm = 6): Promise<FuelStation[]> {
  const where = encodeURIComponent(`within_distance(geom, geom'POINT(${lon} ${lat})', ${radiusKm}km)`);
  const select = "id,geom,ville,adresse,gazole_prix,e10_prix,sp95_prix";
  const url =
    `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/` +
    `prix-des-carburants-en-france-flux-instantane-v2/records?where=${where}&limit=40&select=${select}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FR fuel ${res.status}`);
  const json = (await res.json()) as { results?: FrRecord[] };
  return (json.results ?? [])
    .filter((r) => r.geom)
    .map((r): FuelStation => ({
      id: `fr-${r.id}`,
      name: r.ville || r.adresse || "Station",
      lat: r.geom!.lat,
      lon: r.geom!.lon,
      distanceKm: haversineKm(lat, lon, r.geom!.lat, r.geom!.lon),
      diesel: num(r.gazole_prix),
      e5: num(r.sp95_prix),
      e10: num(r.e10_prix),
      source: "FR",
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

interface TkStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  dist: number;
  diesel?: number;
  e5?: number;
  e10?: number;
  isOpen?: boolean;
}

async function fetchGermany(lat: number, lon: number, radiusKm = 6): Promise<FuelStation[]> {
  const key = process.env.EXPO_PUBLIC_TANKERKOENIG_KEY;
  if (!key) return []; // no key yet → stations come from OSM without prices
  const url =
    `https://creativecommons.tankerkoenig.de/json/list.php?lat=${lat}&lng=${lon}` +
    `&rad=${radiusKm}&sort=dist&type=all&apikey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DE fuel ${res.status}`);
  const json = (await res.json()) as { ok?: boolean; stations?: TkStation[] };
  if (!json.ok || !json.stations) return [];
  return json.stations.slice(0, 40).map((s): FuelStation => ({
    id: `de-${s.id}`,
    name: s.name,
    lat: s.lat,
    lon: s.lng,
    distanceKm: s.dist,
    diesel: num(s.diesel),
    e5: num(s.e5),
    e10: num(s.e10),
    isOpen: s.isOpen,
    source: "DE",
  }));
}

export async function fetchFuelPrices(lat: number, lon: number): Promise<FuelStation[]> {
  const country = countryOf(lat, lon);
  if (country === "fr") return fetchFrance(lat, lon);
  if (country === "de") return fetchGermany(lat, lon);
  return [];
}
