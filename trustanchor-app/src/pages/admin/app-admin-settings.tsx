import { useCallback, useEffect, useState } from "react"
import { CalendarClock, History, KeyRound, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getMasterKeyStatus,
  rotateMasterKey,
  rotateRootKey,
  type MasterKeyRotationResult,
  type MasterKeyStatus,
  type RootKeyRotationResult,
} from "@/lib/master-key-service"

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : "N/A"

export default function AppAdminSettings() {
  const [status, setStatus] = useState<MasterKeyStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [rotating, setRotating] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastResult, setLastResult] = useState<MasterKeyRotationResult | null>(
    null
  )
  const [rotatingRoot, setRotatingRoot] = useState(false)
  const [confirmRootOpen, setConfirmRootOpen] = useState(false)
  const [lastRootResult, setLastRootResult] =
    useState<RootKeyRotationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setStatus(await getMasterKeyStatus())
      setError(null)
    } catch (err) {
      console.error("Failed loading master key status", err)
      setError("Failed to load master key status.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line
    fetchStatus()
  }, [fetchStatus])

  const handleRotate = async () => {
    setRotating(true)
    try {
      const result = await rotateMasterKey()
      setLastResult(result)
      setError(null)
      await fetchStatus()
    } catch (err) {
      console.error("Master key rotation failed", err)
      setError("Rotation failed — check that Vault is reachable and try again.")
    } finally {
      setRotating(false)
      setConfirmOpen(false)
    }
  }

  const handleRotateRoot = async () => {
    setRotatingRoot(true)
    try {
      const result = await rotateRootKey()
      setLastRootResult(result)
      setError(null)
      await fetchStatus()
    } catch (err) {
      console.error("Root key rotation failed", err)
      setError("Root key rotation failed — no changes were applied.")
    } finally {
      setRotatingRoot(false)
      setConfirmRootOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse p-8 font-mono text-xs text-muted-foreground">
        READING KEY MANAGEMENT STATE...
      </div>
    )
  }

  const stats = [
    {
      label: "Active Key Version",
      value: status ? `v${status.activeVersion}` : "—",
      icon: KeyRound,
      color: "text-cyan-500",
    },
    {
      label: "Last Rotated",
      value: formatDate(status?.lastRotatedAt),
      icon: RefreshCw,
      color: "text-emerald-500",
    },
    {
      label: "Next Scheduled Rotation",
      value: formatDate(status?.nextScheduledRotation),
      icon: CalendarClock,
      color: "text-amber-500",
    },
    {
      label: "Rotations Performed",
      value: String(status?.rotationCount ?? 0),
      icon: History,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="w-full max-w-6xl space-y-6 p-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground uppercase italic">
          Key Management
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The master key (stored in Vault) wraps the root key, which wraps
          per-organization keys protecting certificate private keys. Rotation
          re-wraps only the root key — no certificate data is re-encrypted.
        </p>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-500">
          {error}
        </div>
      )}

      {lastResult && !error && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 font-mono text-xs text-emerald-500">
          Master key rotated: v{lastResult.previousVersion} → v
          {lastResult.newVersion} at {formatDate(lastResult.rotatedAt)}
        </div>
      )}

      {lastRootResult && !error && (
        <div className="border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 font-mono text-xs text-emerald-500">
          Root key rotated: #{lastRootResult.previousRootKeyId} → #
          {lastRootResult.newRootKeyId} ·{" "}
          {lastRootResult.organizationKeysRewrapped} organization keys
          re-wrapped at {formatDate(lastRootResult.rotatedAt)}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-sidebar-border bg-sidebar/40"
          >
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <h3 className="mt-1 text-sm font-bold">{stat.value}</h3>
              </div>
              <stat.icon className={`size-7 ${stat.color} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between border border-border bg-sidebar/40 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Master key rotation
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Next automatic rotation:{" "}
            <span className="font-semibold text-foreground">
              {formatDate(status?.nextScheduledRotation)}
            </span>{" "}
            — or rotate immediately below.
          </p>
        </div>
        <Button onClick={() => setConfirmOpen(true)} disabled={rotating}>
          <RefreshCw className={`size-4 ${rotating ? "animate-spin" : ""}`} />
          {rotating ? "Rotating..." : "Rotate Now"}
        </Button>
      </div>

      <div className="flex items-center justify-between border border-border bg-sidebar/40 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Root key rotation
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Generates a new root key and re-wraps all organization keys under it
            — use if the root key is suspected compromised.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setConfirmRootOpen(true)}
          disabled={rotatingRoot}
        >
          <KeyRound
            className={`size-4 ${rotatingRoot ? "animate-pulse" : ""}`}
          />
          {rotatingRoot ? "Rotating..." : "Rotate Root Key"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-none border border-border bg-sidebar/40">
        <div className="grid grid-cols-4 gap-4 border-b border-border bg-muted/60 px-6 py-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          <div>Root Key ID</div>
          <div>Wrapped With Master Key</div>
          <div>Created</div>
          <div>Status</div>
        </div>

        {status?.history.map((entry) => (
          <div
            key={entry.id}
            className="grid grid-cols-4 items-center gap-4 border-b border-border/40 px-6 py-4 font-mono text-xs transition-colors hover:bg-muted/20"
          >
            <div className="font-sans font-bold text-foreground">
              #{entry.id}
            </div>
            <div className="text-[11px] text-muted-foreground">
              v{entry.masterKeyVersion}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {formatDate(entry.createdAt)}
            </div>
            <div>
              {entry.active ? (
                <span className="border border-cyan-500/50 bg-cyan-500/10 px-2 py-0.5 text-[10px] tracking-tight text-cyan-500 uppercase">
                  Active
                </span>
              ) : (
                <span className="border border-border bg-sidebar px-2 py-0.5 text-[10px] tracking-tight text-muted-foreground uppercase">
                  Retired · material wiped
                </span>
              )}
            </div>
          </div>
        ))}

        {(!status || status.history.length === 0) && (
          <div className="p-12 text-center font-sans text-xs text-muted-foreground">
            No root key records found.
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate master key now?</DialogTitle>
            <DialogDescription>
              A new 256-bit master key will be generated and stored in Vault as
              a new secret version, and the root key will be re-wrapped under
              it. Organization keys and certificate private keys are not
              re-encrypted, so the system keeps running normally.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={rotating}
            >
              Cancel
            </Button>
            <Button onClick={handleRotate} disabled={rotating}>
              {rotating ? "Rotating..." : "Confirm Rotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRootOpen} onOpenChange={setConfirmRootOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate root key now?</DialogTitle>
            <DialogDescription>
              A new root key will be generated and wrapped under the current
              master key. Every organization key is decrypted and re-wrapped
              under the new root key in a single database transaction — if
              anything fails, no changes are applied. Certificate private keys
              are not re-encrypted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRootOpen(false)}
              disabled={rotatingRoot}
            >
              Cancel
            </Button>
            <Button onClick={handleRotateRoot} disabled={rotatingRoot}>
              {rotatingRoot ? "Rotating..." : "Confirm Rotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
