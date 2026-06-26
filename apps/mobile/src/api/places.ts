// Real nearby services via the free, key-less OpenStreetMap Overpass API.
// Used by the Services screen; falls back to demo data when offline (e.g. the localhost preview).
// Attribution: © OpenStreetMap contributors (ODbL).

export type PlaceCategory = "workshop" | "fuel" | "tires" | "wash";

export interface PlaceItem {
  id: string;
  name: string;
  category: PlaceCategory;
  distanceKm: number;
  lat: number;
  lon: number;
}

// Munich city centre — default when geolocation is unavailable (matches the demo plates "M·AL").
const FALLBACK = { lat: 48.1374, lon: 11.5755 };

export async function getLocation(): Promise<{ lat: number; lon: number }> {
  const geo = (globalThis as { navigator?: { geolocation?: Geolocation } }).navigator?.geolocation;
  if (!geo) return FALLBACK;
  return new Promise((resolve) => {
    geo.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve(FALLBACK),
      { timeout: 5000, maximumAge: 600000 },
    );
  });
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

function categoryOf(tags: Record<string, string>): PlaceCategory | null {
  if (tags.amenity === "car_repair") return "workshop";
  if (tags.amenity === "fuel") return "fuel";
  if (tags.amenity === "car_wash") return "wash";
  if (tags.shop === "tyres") return "tires";
  return null;
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

export async function fetchNearbyServices(lat: number, lon: number, radiusM = 5000): Promise<PlaceItem[]> {
  const q =
    `[out:json][timeout:20];(` +
    `node["amenity"="car_repair"](around:${radiusM},${lat},${lon});` +
    `node["amenity"="fuel"](around:${radiusM},${lat},${lon});` +
    `node["amenity"="car_wash"](around:${radiusM},${lat},${lon});` +
    `node["shop"="tyres"](around:${radiusM},${lat},${lon});` +
    `);out body 80;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);

  const json = (await res.json()) as { elements?: OverpassElement[] };
  return (json.elements ?? [])
    .map((e): PlaceItem | null => {
      if (e.lat == null || e.lon == null) return null;
      const category = categoryOf(e.tags ?? {});
      if (!category) return null;
      return {
        id: String(e.id),
        name: e.tags?.name ?? e.tags?.brand ?? e.tags?.operator ?? "—",
        category,
        distanceKm: haversineKm(lat, lon, e.lat, e.lon),
        lat: e.lat,
        lon: e.lon,
      };
    })
    .filter((p): p is PlaceItem => p !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 25);
}
