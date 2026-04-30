import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2,
  Calendar,
  Globe,
  Hash,
  type LucideIcon,
  Mail,
  MapPin,
  Save,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  type OrganizationFormValues,
  organizationSchema,
} from "@/lib/validations.ts"

interface AppOrganizationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: OrganizationFormValues) => void
}

export default function AppOrganizationDialog({
  isOpen,
  onClose,
  onSubmit,
}: AppOrganizationDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      registrationDate: new Date().toISOString().split("T")[0],
    },
  })

  const handleFormSubmit = (data: OrganizationFormValues) => {
    onSubmit(data)
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-none border-2 border-sidebar-border bg-sidebar p-0 shadow-2xl">
        <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
              <Building2 size={18} />
            </div>
            <div>
              <DialogTitle className="text-sm font-black tracking-[0.2em] uppercase">
                Register New Entity
              </DialogTitle>
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                PKI Infrastructure Node
              </p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-2 space-y-2">
              <Label icon={Building2} label="Organization Legal Name" />
              <Input
                {...register("name")}
                placeholder="e.g. SIIT Security Lab"
                className={`rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && <ErrorMsg msg={errors.name.message} />}
            </div>
            <div className="space-y-2">
              <Label icon={Hash} label="Organization Code (X.509 O)" />
              <Input
                {...register("code")}
                placeholder="SIIT"
                className="rounded-none border-sidebar-border bg-sidebar/50 font-mono uppercase focus-visible:ring-primary"
              />
              {errors.code && <ErrorMsg msg={errors.code.message} />}
            </div>
            <div className="space-y-2">
              <Label icon={MapPin} label="Physical Location" />
              <Input
                {...register("location")}
                placeholder="Novi Sad, Serbia"
                className="rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary"
              />
              {errors.location && <ErrorMsg msg={errors.location.message} />}
            </div>
            <div className="space-y-2">
              <Label icon={Mail} label="Administrative Email" />
              <Input
                {...register("email")}
                placeholder="contact@siit.rs"
                className="rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary"
              />
              {errors.email && <ErrorMsg msg={errors.email.message} />}
            </div>
            <div className="space-y-2">
              <Label icon={Globe} label="Official Domain" />
              <Input
                {...register("domain")}
                placeholder="siit.rs"
                className="rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary"
              />
              {errors.domain && <ErrorMsg msg={errors.domain.message} />}
            </div>
            <div className="col-span-2 space-y-2">
              <Label icon={Calendar} label="Formal Registration Date" />
              <Input
                type="date"
                {...register("registrationDate")}
                className="rounded-none border-sidebar-border bg-sidebar/50 focus-visible:ring-primary"
              />
              {errors.registrationDate && (
                <ErrorMsg msg={errors.registrationDate.message} />
              )}
            </div>
          </div>
          <div className="mt-10 flex items-center justify-end gap-4 border-t border-sidebar-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-none font-bold tracking-widest text-muted-foreground uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-none bg-primary px-8 font-black tracking-[0.2em] uppercase shadow-lg shadow-primary/20"
            >
              {isSubmitting ? "Processing..." : "Commit Entity"}
              <Save className="ml-2 size-4" />
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
    <p className="text-[9px] font-bold tracking-tighter text-destructive uppercase">
      {msg}
    </p>
  )
}