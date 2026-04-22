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

export const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(255),
  code: z
    .string()
    .min(2, "Code too short")
    .max(64)
    .regex(/^[A-Z0-9_-]+$/, "Uppercase alphanumeric only"),
  location: z.string().min(1, "Location is required"),
  email: z.string().email("Invalid email format"),
  website: z.string().min(1, "Domain is required"),
  registrationDate: z.string().min(1, "Date is required"),
})

export type OrganizationFormValues = z.infer<typeof organizationSchema>
