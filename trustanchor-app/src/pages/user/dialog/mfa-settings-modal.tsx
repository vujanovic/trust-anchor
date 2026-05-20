import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from "@/hooks/use-auth"
import { setup2fa, toggle2fa } from "@/lib/2fa-service"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MfaSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function MfaSettingsModal({ open, onClose }: MfaSettingsModalProps) {
  const { user, updateUserMfaStatus } = useAuth()
  
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false)
  const [setupData, setSetupData] = useState<{ secretKey: string; qrCodeUrl: string }>({ 
    secretKey: '', 
    qrCodeUrl: '' 
  })
  const [totpCode, setTotpCode] = useState<string>('')
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  if (!user) return null

  const handleStartSetup = async (): Promise<void> => {
    try {
      setError("")
      const res = await setup2fa()
      setSetupData(res)
      setIsSettingUp(true)
    } catch {
      setError("Failed to fetch security configurations keys.")
    }
  }

  const handleToggleMfa = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const secretKeyParam = !user.mfaEnabled ? setupData.secretKey : null
      await toggle2fa(totpCode, secretKeyParam)
      
      updateUserMfaStatus(!user.mfaEnabled)
      setIsSettingUp(false)
      setTotpCode('')
      onClose() // Close modal window upon successful activation/deactivation
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(message ?? "Verification failed. Please check your token.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setIsSettingUp(false)
    setTotpCode('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Two-Factor Authentication (2FA)
          </DialogTitle>
          <DialogDescription>
            Current Status: <strong className={user.mfaEnabled ? "text-emerald-500" : "text-muted-foreground"}>
              {user.mfaEnabled ? "ENABLED" : "DISABLED"}
            </strong>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-destructive text-sm font-medium bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
            {error}
          </p>
        )}

        {/* State 1: Disabled & Not Setting Up */}
        {!user.mfaEnabled && !isSettingUp && (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-4 text-left">
              Secure your X.509 certificate management workspace by enforcing a second factor confirmation check.
            </p>
            <Button type="button" onClick={handleStartSetup} className="w-full">
              Enable 2FA Protection
            </Button>
          </div>
        )}

        {/* State 2: Setup Dynamic Form (QR Generation) */}
        {!user.mfaEnabled && isSettingUp && (
          <form onSubmit={handleToggleMfa} className="space-y-4 pt-2">
            <p className="text-sm text-foreground font-medium">1. Scan this QR code with Google Authenticator:</p>
            <div className="flex justify-center p-3 bg-white rounded-xl border max-w-[200px] mx-auto">
              <QRCodeSVG value={setupData.qrCodeUrl} size={180} />
            </div>
            <p className="text-center text-[11px] font-mono text-muted-foreground tracking-tight select-all">
              Manual Key: {setupData.secretKey}
            </p>
            
            <p className="text-sm text-foreground font-medium pt-2">2. Enter the 6-digit confirmation code:</p>
            <input 
              type="text" 
              maxLength={6} 
              placeholder="000000" 
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-xl tracking-[0.5em] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
              disabled={isSubmitting}
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Confirm & Activate"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsSettingUp(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* State 3: Enabled - Request Token to Turn Off */}
        {user.mfaEnabled && (
          <form onSubmit={handleToggleMfa} className="space-y-4 pt-2">
            <p className="text-sm text-destructive font-medium">
              To disable 2FA protection, enter a valid 6-digit authenticator token:
            </p>
            <input 
              type="text" 
              maxLength={6} 
              placeholder="000000" 
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-xl tracking-[0.5em] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
              disabled={isSubmitting}
            />
            <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Disable 2FA Protection"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}