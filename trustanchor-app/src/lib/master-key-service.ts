import { createService } from "./base-service"

const service = createService("/admin/master-key")

export interface RootKeyInfo {
  id: number
  masterKeyVersion: number
  createdAt: string
  active: boolean
}

export interface MasterKeyStatus {
  activeVersion: number
  lastRotatedAt: string | null
  rotationCount: number
  rotationCron: string
  nextScheduledRotation: string | null
  history: RootKeyInfo[]
}

export interface MasterKeyRotationResult {
  previousVersion: number
  newVersion: number
  rotatedAt: string
}

export const getMasterKeyStatus = () => service.get<MasterKeyStatus>("/status")

export const rotateMasterKey = () =>
  service.post<MasterKeyRotationResult>("/rotate")
