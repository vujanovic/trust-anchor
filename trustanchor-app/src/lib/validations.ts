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
  repeatPassword: passwordSchema,
  organizationId: z.number().min(1, "Please select an organization"),
  publicKey: z.string().min(1, "Public key generation failed"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export type RegistrationValues = z.infer<typeof registrationSchema>
export type LoginValues = z.infer<typeof loginSchema>

export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Organization name is required" })
    .max(255, { message: "Name is too long" }),

  code: z
    .string()
    .min(2, { message: "Code must be at least 2 characters" })
    .max(64, { message: "Code must be under 64 characters" })
    .regex(/^[A-Z0-9_-]+$/, {
      message:
        "Code must be uppercase alphanumeric (dashes and underscores allowed)",
    }),

  location: z.string().min(1, { message: "Location is required" }),

  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email format" }),

  domain: z
    .string()
    .min(1, { message: "Domain is required" })
    .regex(
      /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/,
      {
        message: "Invalid domain format (e.g., example.com)",
      }
    ),

  registrationDate: z
    .string()
    .min(1, { message: "Registration date is required" }),
})

export type OrganizationFormValues = z.infer<typeof organizationSchema>

export const caUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  organizationId: z.number().min(1, "Please select an organization"),
  userRole: z.enum(["ADMIN", "CA_USER", "USER"]),
})

export type CaUserFormValues = z.infer<typeof caUserSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>
