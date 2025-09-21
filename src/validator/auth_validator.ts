import z from "zod";

export const friendSchema = z
  .object({
    email: z.email().optional(),
    id: z.coerce.number().optional(),
  })
  .refine((data) => data.id || data.email, {
    message: "Either id or email must be provided",
  });
