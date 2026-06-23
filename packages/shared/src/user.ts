import { z } from "zod";

export const localeSchema = z.enum(["ru", "en", "de"]);
export type Locale = z.infer<typeof localeSchema>;

export const subscriptionTierSchema = z.enum(["free", "pro"]);
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

export const authProviderSchema = z.enum(["apple", "google", "email"]);
export type AuthProvider = z.infer<typeof authProviderSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(120).nullable(),
  locale: localeSchema.default("en"),
  subscriptionTier: subscriptionTierSchema.default("free"),
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;
