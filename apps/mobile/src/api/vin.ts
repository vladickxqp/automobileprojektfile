// Real VIN decoding via the free, key-less NHTSA vPIC API (CORS: *). Works on web and native.
// Falls back to the demo decoder when offline or when a VIN isn't recognised.
import type { DecodeDTO } from "./client";

interface VpicResult {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  DisplacementL?: string;
  FuelTypePrimary?: string;
  BodyClass?: string;
  PlantCountry?: string;
}

export async function decodeVin(vin: string): Promise<DecodeDTO> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`vPIC ${res.status}`);
  const json = (await res.json()) as { Results?: VpicResult[] };
  const r = json.Results?.[0] ?? {};
  if (!r.Make && !r.Model) throw new Error("VIN nicht erkannt");

  const year = r.ModelYear ? Number(r.ModelYear) : NaN;
  const disp = r.DisplacementL ? `${Number(r.DisplacementL).toFixed(1)} L` : null;
  const engine = [disp, r.FuelTypePrimary, r.BodyClass].filter(Boolean).join(" · ") || null;

  return {
    vin,
    year: Number.isFinite(year) ? year : null,
    make: r.Make || null,
    model: r.Model || null,
    engine,
    country: r.PlantCountry || null,
    source: "NHTSA vPIC",
  };
}
