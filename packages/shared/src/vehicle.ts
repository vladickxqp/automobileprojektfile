import { z } from "zod";

/**
 * ISO 3779 VIN: exactly 17 characters, excluding I, O and Q.
 * The VIN is the car's permanent identity — the whole CarDNA history hangs off it,
 * which is why the record belongs to the vehicle and not to a user.
 */
export const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(17)
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "Invalid VIN (17 chars, excludes I/O/Q)");
export type Vin = z.infer<typeof vinSchema>;

export const vehicleSchema = z.object({
  id: z.string().uuid(),
  vin: vinSchema,
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1900).max(2100),
  engine: z.string().max(120).nullable(),
  plate: z.string().max(20).nullable(),
  photoUrl: z.string().url().nullable(),
  mileageKm: z.number().int().nonnegative().nullable(),
  createdAt: z.coerce.date(),
});
export type Vehicle = z.infer<typeof vehicleSchema>;

/** A car is reached through an Ownership, never via a direct user FK — this is what lets the
 * history survive a change of owner (the foundation of CarDNA, #40). */
export const ownershipRoleSchema = z.enum(["owner", "viewer"]);
export type OwnershipRole = z.infer<typeof ownershipRoleSchema>;

export const ownershipSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string().uuid(),
  userId: z.string().uuid(),
  role: ownershipRoleSchema,
  from: z.coerce.date(),
  /** `null` means this is the current owner. */
  to: z.coerce.date().nullable(),
});
export type Ownership = z.infer<typeof ownershipSchema>;
