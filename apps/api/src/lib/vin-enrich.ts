export interface NhtsaDecode {
  year?: number;
  make?: string;
  model?: string;
  engine?: string;
}

/**
 * Best-effort make/model enrichment via NHTSA vPIC (free, no key). Returns null on any failure
 * (offline, timeout, unknown VIN) so the caller can always fall back to the offline decoder.
 */
export async function enrichFromNhtsa(vin: string, timeoutMs = 4000): Promise<NhtsaDecode | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { Results?: Array<Record<string, string | null>> };
    const r = data.Results?.[0];
    if (!r) return null;

    const yearNum = r.ModelYear ? Number(r.ModelYear) : NaN;
    const displacement = r.DisplacementL ? `${Number(r.DisplacementL).toFixed(1)}L` : "";
    const engine = [displacement, r.FuelTypePrimary ?? ""].filter(Boolean).join(" ").trim();

    return {
      year: Number.isFinite(yearNum) ? yearNum : undefined,
      make: r.Make || undefined,
      model: r.Model || undefined,
      engine: engine || undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
