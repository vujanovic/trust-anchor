import * as z from "zod"

const passwordSchema = z
  .string()
  .min(15, "Password must be at least 15 characters")
  .max(64, "Password must be at most 64 characters")

export const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email format").max(255),
  password: passwordSchema, // Reusability!
  organizationId: z.coerce.number().positive("Organization is required"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export type RegistrationValues = z.infer<typeof registrationSchema>
export type LoginValues = z.infer<typeof loginSchema>