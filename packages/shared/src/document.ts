import { z } from "zod";

/** Document categories (#7). `tuv` and `insurance` are the ones that drive reminders (#8). */
export const documentTypeSchema = z.enum([
  "insurance",
  "techpassport",
  "tuv",
  "invoice",
  "contract",
  "other",
]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

export const documentSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  type: documentTypeSchema,
  fileUrl: z.string(),
  title: z.string().max(160).nullable(),
  issuedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});
export type Document = z.infer<typeof documentSchema>;
