import { z } from "zod";

export const reminderKindSchema = z.enum(["service", "insurance", "tuv", "oil", "custom"]);
export type ReminderKind = z.infer<typeof reminderKindSchema>;

/**
 * A reminder (#8). Can be due by date and/or by mileage. Some reminders are explicit (created by
 * the user) and some are derived on the fly from document expiry — `source` distinguishes them.
 */
export const reminderSchema = z.object({
  id: z.string(),
  vehicleId: z.string().uuid(),
  kind: reminderKindSchema,
  title: z.string().min(1).max(160),
  dueDate: z.coerce.date().nullable(),
  dueMileageKm: z.number().int().nonnegative().nullable(),
  completedAt: z.coerce.date().nullable(),
  source: z.enum(["user", "document"]).default("user"),
});
export type Reminder = z.infer<typeof reminderSchema>;
