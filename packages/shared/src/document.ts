import { z } from "zod";

/** Document categories (#7). `tuv`, `insurance`, `tax` and `warranty` drive reminders (#8). */
export const documentTypeSchema = z.enum([
  "insurance",
  "techpassport",
  "tuv",
  "invoice",
  "contract",
  "tax",
  "warranty",
  "other",
]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

/** Payment cadence for recurring documents (insurance premium, tax). */
export const paymentIntervalSchema = z.enum(["monthly", "quarterly", "semiannual", "annual"]);
export type PaymentInterval = z.infer<typeof paymentIntervalSchema>;

/**
 * Structured, type-specific metadata for "Documents 2.0" — turns a document from a plain file into
 * real vehicle admin (insurer, premium, warranty scope, …). All optional; stored as JSON.
 */
export const documentMetaSchema = z.object({
  insurer: z.string().max(120).optional(),
  policyNumber: z.string().max(80).optional(),
  premium: z.number().nonnegative().optional(),
  interval: paymentIntervalSchema.optional(),
  paymentDate: z.coerce.date().optional(),
  amount: z.number().nonnegative().optional(),
  debitDate: z.coerce.date().optional(),
  dealer: z.string().max(120).optional(),
  scope: z.string().max(500).optional(),
});
export type DocumentMeta = z.infer<typeof documentMetaSchema>;

export const documentSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  type: documentTypeSchema,
  fileUrl: z.string(),
  title: z.string().max(160).nullable(),
  issuedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date().nullable(),
  meta: documentMetaSchema.nullable().optional(),
  createdAt: z.coerce.date(),
});
export type Document = z.infer<typeof documentSchema>;
