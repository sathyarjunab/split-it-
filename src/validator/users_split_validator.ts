import zod from "zod";

export const UsersSplitValidator = zod.object({
  userId: zod.coerce.string(),
  amount: zod.number().min(0),
});

export const SplitValidator = zod.object({
  userId: zod.coerce.string(),
  moneyBorrower: zod.array(UsersSplitValidator).min(1),
});

export const userSignupValidator = zod.object({
  email: zod.email(),
  password: zod
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  name: zod.string(),
});

export const userLoginValidation = userSignupValidator.omit({ name: true });
