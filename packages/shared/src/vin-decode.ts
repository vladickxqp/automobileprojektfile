import { vinSchema, type Vin } from "./vehicle";

export interface VinDecodeResult {
  vin: Vin;
  /** World Manufacturer Identifier — the first 3 VIN characters. */
  wmi: string;
  /** Model year derived from VIN position 10, or null if the code is unknown. */
  modelYear: number | null;
  /** Manufacturer when the WMI is in our table, else null. */
  manufacturer: string | null;
  /** Best-effort country of manufacture, else null. */
  country: string | null;
}

// VIN position 10 → base model year (1980–2009 cycle). The code repeats every 30 years;
// decodeModelYear() walks the cycle forward to the most recent plausible year.
const YEAR_CODE_BASE: Record<string, number> = {
  A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986, H: 1987,
  J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993, R: 1994, S: 1995,
  T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000,
  "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005, "6": 2006,
  "7": 2007, "8": 2008, "9": 2009,
};

// World Manufacturer Identifier → make + country. Focused on the German / EU / RU / JP / KR
// brands that matter for this market. Reference data, expanded as needed.
const MANUFACTURER_BY_WMI: Record<string, { manufacturer: string; country: string }> = {
  WBA: { manufacturer: "BMW", country: "Germany" },
  WBS: { manufacturer: "BMW M", country: "Germany" },
  WBX: { manufacturer: "BMW", country: "Germany" },
  WBY: { manufacturer: "BMW i", country: "Germany" },
  WMW: { manufacturer: "MINI", country: "Germany" },
  WDB: { manufacturer: "Mercedes-Benz", country: "Germany" },
  WDD: { manufacturer: "Mercedes-Benz", country: "Germany" },
  WDC: { manufacturer: "Mercedes-Benz", country: "Germany" },
  W1K: { manufacturer: "Mercedes-Benz", country: "Germany" },
  W1N: { manufacturer: "Mercedes-Benz", country: "Germany" },
  WAU: { manufacturer: "Audi", country: "Germany" },
  WA1: { manufacturer: "Audi", country: "Germany" },
  TRU: { manufacturer: "Audi", country: "Hungary" },
  WVW: { manufacturer: "Volkswagen", country: "Germany" },
  WV1: { manufacturer: "Volkswagen", country: "Germany" },
  WV2: { manufacturer: "Volkswagen", country: "Germany" },
  WP0: { manufacturer: "Porsche", country: "Germany" },
  WP1: { manufacturer: "Porsche", country: "Germany" },
  WF0: { manufacturer: "Ford", country: "Germany" },
  VF1: { manufacturer: "Renault", country: "France" },
  VF3: { manufacturer: "Peugeot", country: "France" },
  VF7: { manufacturer: "Citroën", country: "France" },
  ZFA: { manufacturer: "Fiat", country: "Italy" },
  ZAR: { manufacturer: "Alfa Romeo", country: "Italy" },
  ZFF: { manufacturer: "Ferrari", country: "Italy" },
  ZHW: { manufacturer: "Lamborghini", country: "Italy" },
  TMB: { manufacturer: "Škoda", country: "Czechia" },
  VSS: { manufacturer: "SEAT", country: "Spain" },
  YV1: { manufacturer: "Volvo", country: "Sweden" },
  SAL: { manufacturer: "Land Rover", country: "United Kingdom" },
  SAJ: { manufacturer: "Jaguar", country: "United Kingdom" },
  XTA: { manufacturer: "Lada (AvtoVAZ)", country: "Russia" },
  XW8: { manufacturer: "Volkswagen", country: "Russia" },
  JTD: { manufacturer: "Toyota", country: "Japan" },
  JN1: { manufacturer: "Nissan", country: "Japan" },
  JHM: { manufacturer: "Honda", country: "Japan" },
  KMH: { manufacturer: "Hyundai", country: "South Korea" },
  KNA: { manufacturer: "Kia", country: "South Korea" },
};

// First-character fallback — only the unambiguous ranges, to avoid wrong guesses.
const COUNTRY_BY_FIRST_CHAR: Record<string, string> = {
  "1": "United States",
  "4": "United States",
  "5": "United States",
  "2": "Canada",
  "3": "Mexico",
  J: "Japan",
  K: "South Korea",
  L: "China",
  W: "Germany",
};

export function decodeModelYear(code: string, now = new Date().getFullYear()): number | null {
  const base = YEAR_CODE_BASE[code.toUpperCase()];
  if (base === undefined) return null;
  let year = base;
  while (year + 30 <= now + 1) year += 30;
  return year;
}

/**
 * Decode the deterministic parts of a VIN (year, manufacturer, country). Throws if the VIN is
 * structurally invalid. Make/model beyond the WMI requires external enrichment (e.g. NHTSA vPIC).
 */
export function decodeVin(input: string): VinDecodeResult {
  const vin = vinSchema.parse(input);
  const wmi = vin.slice(0, 3);
  const known = MANUFACTURER_BY_WMI[wmi];

  return {
    vin,
    wmi,
    modelYear: decodeModelYear(vin.charAt(9)),
    manufacturer: known?.manufacturer ?? null,
    country: known?.country ?? COUNTRY_BY_FIRST_CHAR[vin.charAt(0)] ?? null,
  };
}

/** Safe variant: returns null instead of throwing on an invalid VIN. */
export function tryDecodeVin(input: string): VinDecodeResult | null {
  return vinSchema.safeParse(input).success ? decodeVin(input) : null;
}
