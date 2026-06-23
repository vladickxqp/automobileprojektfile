import { z } from "zod";

/**
 * AutoScore (#13): a 1–100 condition index with a transparent factor breakdown.
 * MVP computes it from rules + Claude's model-level knowledge; in V4 it becomes ML-backed
 * once enough VehicleEvents have accumulated.
 */
export const autoScoreFactorKeySchema = z.enum([
  "maintenance",
  "history",
  "diagnostics",
  "age",
  "mileage",
]);
export type AutoScoreFactorKey = z.infer<typeof autoScoreFactorKeySchema>;

export const autoScoreFactorSchema = z.object({
  key: autoScoreFactorKeySchema,
  label: z.string(),
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
});
export type AutoScoreFactor = z.infer<typeof autoScoreFactorSchema>;

export const autoScoreSchema = z.object({
  vehicleId: z.string().uuid(),
  score: z.number().int().min(1).max(100),
  factors: z.array(autoScoreFactorSchema),
  computedAt: z.coerce.date(),
});
export type AutoScore = z.infer<typeof autoScoreSchema>;
