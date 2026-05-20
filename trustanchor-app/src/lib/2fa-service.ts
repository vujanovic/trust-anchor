import { createService } from "./base-service"
const service = createService("/2fa")

export const setup2fa = () => service.get<{ secretKey: string; qrCodeUrl: string }>("/setup")

export const toggle2fa = (totpCode: string, secretKey: string | null) =>
  service.post("/toggle", { totpCode, secretKey })