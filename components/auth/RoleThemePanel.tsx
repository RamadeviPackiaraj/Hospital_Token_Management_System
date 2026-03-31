import { Building2, Shield, Stethoscope } from "lucide-react";
import { AuthRole, roleThemes } from "@/lib/auth-flow";
import { Card } from "@/components/ui";

const roleIcons = {
  doctor: Stethoscope,
  hospital: Building2,
  admin: Shield
} as const;

export function RoleThemePanel({
  role,
  name,
  mobileNumber,
  email
}: {
  role: AuthRole;
  name: string;
  mobileNumber: string;
  email?: string;
}) {
  const Icon = roleIcons[role];
  const theme = roleThemes[role];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#64748B]">{theme.badge}</p>
        <h1 className="text-[20px] font-medium text-[#0F172A]">Welcome, {name}</h1>
        <p className="text-sm text-[#64748B]">Minimal access view for the hospital token management system.</p>
      </div>

      <Card className={`flex items-center gap-4 p-5 ${theme.tint}`}>
        <div className="flex size-11 items-center justify-center rounded-xl bg-white">
          <Icon className={`size-5 ${theme.accent}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#0F172A]">{theme.title}</p>
          <p className="text-sm text-[#64748B]">Active mobile: {mobileNumber}</p>
          {email ? <p className="text-sm text-[#64748B]">Email: {email}</p> : null}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-[#64748B]">Queue status</p>
          <p className="mt-2 text-sm font-medium text-[#0F172A]">Connected</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#64748B]">Authentication</p>
          <p className="mt-2 text-sm font-medium text-[#0F172A]">Verified</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#64748B]">Backend mode</p>
          <p className="mt-2 text-sm font-medium text-[#0F172A]">Live data</p>
        </Card>
      </div>
    </div>
  );
}
