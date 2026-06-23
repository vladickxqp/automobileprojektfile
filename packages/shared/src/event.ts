import { z } from "zod";

/**
 * Visibility decides whether an event travels with the car to its next owner (`carDNA`)
 * or stays in the current owner's private workspace (`private`).
 * The sale report (#14) and CarDNA (#40) are built only from the `carDNA` layer.
 */
export const visibilitySchema = z.enum(["private", "carDNA"]);
export type Visibility = z.infer<typeof visibilitySchema>;

export const vehicleEventTypeSchema = z.enum([
  "maintenance",
  "repair",
  "scan",
  "expense",
  "document",
  "incident",
  "score",
]);
export type VehicleEventType = z.infer<typeof vehicleEventTypeSchema>;

/**
 * Append-only timeline entry — the spine of CarDNA and of the future ML data set (#34–38).
 * `payload` holds the type-specific detail; keep it structured (no free-text dumps) so it stays
 * trainable and reportable. `occurredAt` + `mileageKm` are the axes for trends and predictions.
 */
export const vehicleEventSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  type: vehicleEventTypeSchema,
  occurredAt: z.coerce.date(),
  mileageKm: z.number().int().nonnegative().nullable(),
  visibility: visibilitySchema.default("private"),
  payload: z.record(z.unknown()),
  createdByUserId: z.string().uuid(),
  createdAt: z.coerce.date(),
});
export type VehicleEvent = z.infer<typeof vehicleEventSchema>;
