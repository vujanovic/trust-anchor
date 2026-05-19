export interface UserDto {
  id: number
  firstName: string
  lastName: string
  email: string
  organizationId: number
  role: "ADMIN" | "CA_USER" | "USER"
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "BANNED"
  mfaEnabled: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserDto
  mfaRequired: boolean
  mfaToken: string | null
}
