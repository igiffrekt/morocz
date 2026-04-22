import { z } from "zod";

export const addressSchema = z.object({
  postalCode: z
    .string()
    .regex(/^\d{4}$/, "Az irányítószám 4 számjegyből áll"),
  city: z
    .string()
    .trim()
    .min(1, "A település megadása kötelező")
    .max(100, "A település neve túl hosszú"),
  streetAddress: z
    .string()
    .trim()
    .min(3, "Az utca és házszám megadása kötelező")
    .max(200, "A cím túl hosszú"),
});

export type AddressInput = z.infer<typeof addressSchema>;
