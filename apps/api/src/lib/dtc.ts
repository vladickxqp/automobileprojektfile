import { prisma } from "./prisma";

export interface DecodedDtc {
  code: string;
  description: string | null;
  system: string | null;
  severity: number | null;
}

/** Join a list of DTC codes against the DtcCodeRef table; unknown codes come back with nulls. */
export async function decodeDtcCodes(codes: string[]): Promise<DecodedDtc[]> {
  if (codes.length === 0) return [];
  const refs = await prisma.dtcCodeRef.findMany({ where: { code: { in: codes } } });
  const byCode = new Map(refs.map((ref) => [ref.code, ref]));
  return codes.map((code) => {
    const ref = byCode.get(code);
    return {
      code,
      description: ref?.description ?? null,
      system: ref?.system ?? null,
      severity: ref?.severity ?? null,
    };
  });
}
