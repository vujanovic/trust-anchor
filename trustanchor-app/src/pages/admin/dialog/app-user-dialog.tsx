import { type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2,
  CheckCircle2,
  Fingerprint,
  type LucideIcon,
  Mail,
  Shield,
  UserPlus,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { type CaUserFormValues, caUserSchema } from "@/lib/validations.ts"

interface AppUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CaUserFormValues) => void
  organizations: { id: number; name: string }[]
}

export default function AppUserDialog({
  isOpen,
  onClose,
  onSubmit,
  organizations,
}: AppUserDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CaUserFormValues>({
    resolver: zodResolver(caUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      organizationId: 0,
      userRole: "CA_USER",
    },
  })

  const handleFormSubmit: SubmitHandler<CaUserFormValues> = (data) => {
    const payload = {
      ...data,
      organizationId: Number(data.organizationId),
      userRole: "CA_USER" as const,
    }
    onSubmit(payload)
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none border-2 border-sidebar-border bg-sidebar p-0 shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
              <UserPlus size={18} />
            </div>
            <div>
              <DialogTitle className="text-sm font-black tracking-[0.2em] uppercase">
                Enroll New Identity
              </DialogTitle>
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                System Access Control
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {/* Identity Info */}
            <div className="space-y-2">
              <Label icon={Fingerprint} label="First Name" />
              <Input
                {...register("firstName")}
                placeholder="Nikola"
                className="rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary"
              />
              {errors.firstName && <ErrorMsg msg={errors.firstName.message} />}
            </div>

            <div className="space-y-2">
              <Label icon={Fingerprint} label="Last Name" />
              <Input
                {...register("lastName")}
                placeholder="Tesla"
                className="rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary"
              />
              {errors.lastName && <ErrorMsg msg={errors.lastName.message} />}
            </div>

            {/* Credentials */}
            <div className="col-span-2 space-y-2">
              <Label icon={Mail} label="Professional Email Address" />
              <Input
                {...register("email")}
                placeholder="n.tesla@visor.inc"
                className="rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary"
              />
              {errors.email && <ErrorMsg msg={errors.email.message} />}
            </div>

            {/* Assignments */}
            <div className="space-y-2">
              <Label icon={Building2} label="Organization Anchor" />
              <select
                {...register("organizationId", { valueAsNumber: true })}
                className="flex h-10 w-full rounded-none border border-sidebar-border bg-sidebar/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="0">Select entity...</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {errors.organizationId && (
                <ErrorMsg msg={errors.organizationId.message} />
              )}
            </div>

            <div className="space-y-2">
              <Label icon={Shield} label="Security Role" />
              <select
                {...register("userRole")}
                disabled // Locks the field
                className="flex h-10 w-full cursor-not-allowed rounded-none border border-sidebar-border bg-sidebar/50 px-3 py-2 text-sm opacity-60 focus:outline-none"
              >
                <option value="CA_USER">CA User</option>
              </select>
              {errors.userRole && <ErrorMsg msg={errors.userRole.message} />}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-10 flex items-center justify-end gap-4 border-t border-sidebar-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-none font-bold tracking-widest text-muted-foreground uppercase hover:bg-transparent hover:text-primary"
            >
              Abort
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-none bg-primary px-8 font-black tracking-[0.2em] uppercase shadow-lg shadow-primary/20"
            >
              {isSubmitting ? "Provisioning..." : "Authorize Identity"}
              <CheckCircle2 className="ml-2 size-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Label({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
      <Icon size={12} className="text-primary" />
      {label}
    </div>
  )
}

function ErrorMsg({ msg }: { msg?: string }) {
  return (
    <p className="mt-1 text-[9px] font-bold tracking-tighter text-destructive uppercase">
      {msg}
    </p>
  )
}
