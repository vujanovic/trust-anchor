export interface UserDto {
  id: number
  firstName: string
  lastName: string
  email: string
  userRole: "ADMIN" | "CA_USER" | "USER"
  userStatus: "ACTIVE" | "INACTIVE" | "PENDING" | "BANNED"
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserDto
}
