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

// --- Per-type payload schemas. Stored as JSON but always validated, so the timeline stays
// structured and trainable (the whole point of the spine). ---

export const maintenanceCategorySchema = z.enum([
  "service",
  "repair",
  "inspection",
  "tires",
  "other",
]);
export type MaintenanceCategory = z.infer<typeof maintenanceCategorySchema>;

/** Payload for `maintenance` / `repair` events (#6 service history). */
export const maintenanceEventPayloadSchema = z.object({
  title: z.string().min(1).max(120),
  category: maintenanceCategorySchema.default("service"),
  shopName: z.string().max(120).optional(),
  partsCost: z.number().nonnegative().optional(),
  laborCost: z.number().nonnegative().optional(),
  currency: z.string().length(3).default("EUR"),
  notes: z.string().max(2000).optional(),
});
export type MaintenanceEventPayload = z.infer<typeof maintenanceEventPayloadSchema>;

export const expenseCategorySchema = z.enum([
  "fuel",
  "service",
  "insurance",
  "tax",
  "parts",
  "fine",
  "other",
]);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

/** Payload for `expense` events (#9 expense tracking). */
export const expenseEventPayloadSchema = z.object({
  category: expenseCategorySchema,
  amount: z.number().positive(),
  currency: z.string().length(3).default("EUR"),
  note: z.string().max(500).optional(),
});
export type ExpenseEventPayload = z.infer<typeof expenseEventPayloadSchema>;
