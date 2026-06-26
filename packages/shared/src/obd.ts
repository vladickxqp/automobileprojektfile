// OBD-II / ELM327 protocol helpers. Pure functions so they can be unit-tested without hardware
// and shared between the mobile transport layer and the backend.

const DTC_LETTERS = ["P", "C", "B", "U"] as const;

/**
 * Decode two raw DTC bytes into a code string like "P0401" (SAE J2012):
 *   bits 7-6 of byte A -> P/C/B/U, bits 5-4 -> first digit, bits 3-0 -> second digit (hex),
 *   byte B high nibble -> third digit, low nibble -> fourth digit.
 */
export function dtcFromBytes(a: number, b: number): string {
  const letter = DTC_LETTERS[(a >> 6) & 0x03] ?? "P";
  const d1 = (a >> 4) & 0x03;
  const d2 = a & 0x0f;
  const d3 = (b >> 4) & 0x0f;
  const d4 = b & 0x0f;
  return `${letter}${d1}${d2.toString(16)}${d3.toString(16)}${d4.toString(16)}`.toUpperCase();
}

/**
 * Parse an ELM327 mode-03 ("read stored DTCs") response into DTC code strings.
 * Tolerant of spacing, line breaks and the trailing `>` prompt. The 0x43 byte marks the start of
 * the mode-03 response; subsequent byte pairs are DTCs (0x00 0x00 pairs are padding).
 *
 * Note: multi-frame ISO-TP responses and the CAN count byte are not yet handled — that hardening
 * belongs with on-device testing against a real adapter.
 */
export function parseMode03Response(raw: string): string[] {
  const bytes = raw
    .replace(/[\r\n>]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => /^[0-9a-fA-F]{2}$/.test(token))
    .map((token) => parseInt(token, 16));

  const start = bytes.indexOf(0x43);
  if (start === -1) return [];

  const payload = bytes.slice(start + 1);
  const codes: string[] = [];
  for (let i = 0; i + 1 < payload.length; i += 2) {
    const a = payload[i];
    const b = payload[i + 1];
    if (a === undefined || b === undefined) break;
    if (a === 0 && b === 0) continue;
    codes.push(dtcFromBytes(a, b));
  }
  return [...new Set(codes)];
}

/** Validates a DTC code string like "P0401". */
export const DTC_CODE_PATTERN = /^[PCBU][0-9A-F]{4}$/;
