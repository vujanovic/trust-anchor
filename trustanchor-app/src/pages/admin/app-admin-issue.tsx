import { useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function AppAdminIssue() {
  const [certType, setCertType] = useState<string>("ee")

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-sidebar">
      <div className="border-b border-sidebar-border bg-sidebar-accent/5 px-12 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Issue New Certificate
          </h1>
          <p className="text-muted-foreground">
            X.509 v3 Standard Compliant Issuance Engine
          </p>
        </div>
      </div>
      <div className="flex-1 px-12 py-4">
        <div className="max-w-4xl space-y-12 pb-24">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                01
              </div>
              <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
                Issuance Chain
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Certificate Type
                </Label>
                <Select onValueChange={setCertType} defaultValue="ee">
                  <SelectTrigger className="h-12 rounded-none border-sidebar-border bg-sidebar-accent/20 text-sm font-semibold focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-sidebar-border bg-sidebar">
                    <SelectItem value="root">ROOT CA (Self-Signed)</SelectItem>
                    <SelectItem value="intermediate">
                      INTERMEDIATE CA
                    </SelectItem>
                    <SelectItem value="ee">END-ENTITY (User/Device)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {certType !== "root" && (
                <div className="space-y-2">
                  <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                    Signing Issuer (CA)
                  </Label>
                  <Select>
                    <SelectTrigger className="h-12 rounded-none border-sidebar-border bg-sidebar-accent/20 text-sm font-semibold">
                      <SelectValue placeholder="Select Parent CA..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-sidebar-border bg-sidebar">
                      <SelectItem value="ca1">TrustAnchor Root G1</SelectItem>
                      <SelectItem value="ca2">SIIT Intermediate CA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </section>
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                02
              </div>
              <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
                Subject Details (X.500 Name)
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                {
                  label: "Common Name (CN)",
                  placeholder: "e.g. server.example.com",
                },
                {
                  label: "Organization (O)",
                  placeholder: "e.g. My Company LLC",
                },
                {
                  label: "Organizational Unit (OU)",
                  placeholder: "e.g. IT Department",
                },
                { label: "Country (C)", placeholder: "e.g. RS" },
                { label: "Locality (L)", placeholder: "e.g. Novi Sad" },
                { label: "State (ST)", placeholder: "e.g. Vojvodina" },
              ].map((field) => (
                <div key={field.label} className="space-y-2">
                  <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                    {field.label}
                  </Label>
                  <Input
                    placeholder={field.placeholder}
                    className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 focus-visible:ring-primary"
                  />
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                03
              </div>
              <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
                Extensions & Validity
              </h2>
            </div>

            <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  Duration (Days)
                </Label>
                <Input
                  type="number"
                  defaultValue="365"
                  className="h-11 rounded-none border-sidebar-border bg-sidebar-accent/10 font-mono"
                />
              </div>

              <div className="flex h-11 items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-3">
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Basic Constraints (CA)
                </span>
                <Switch checked={certType !== "ee"} />
              </div>

              <div className="flex h-11 items-center justify-between border border-sidebar-border bg-sidebar-accent/10 p-3">
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Key Cert Sign
                </span>
                <Switch checked={certType !== "ee"} />
              </div>
            </div>
          </section>
          <div className="border-t border-sidebar-border pt-12">
            <Card className="rounded-none border-sidebar-border bg-sidebar-accent/10 shadow-none">
              <CardContent className="flex items-start gap-4 p-6">
                <Info className="mt-1 size-5 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-bold tracking-tight uppercase">
                    Pre-Issuance Check
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    System will verify the signing CA's digital signature,
                    revocation status (CRL/OCSP), and ensure the validity period
                    does not exceed the issuer's expiration date.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button className="w-full rounded-none bg-primary px-12 py-6 font-black tracking-[0.2em] text-primary-foreground uppercase shadow-2xl shadow-primary/30 transition-transform hover:scale-105 md:w-auto">
            Generate & Sign Certificate
          </Button>
        </div>
      </div>
    </div>
  )
}
