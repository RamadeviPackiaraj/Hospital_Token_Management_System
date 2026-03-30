"use client";

import { Building2, Settings2, Stethoscope } from "lucide-react";
import { AuthRole, formatRoleLabel } from "@/lib/auth-flow";
import { RoleCard } from "@/components/auth/RoleCard";

const roleIcons = {
  doctor: Stethoscope,
  hospital: Building2,
  admin: Settings2
} as const;

export function RoleSelector({
  selectedRole,
  onSelect
}: {
  selectedRole: AuthRole | null;
  onSelect: (role: AuthRole) => void;
}) {
  return (
    <div className="space-y-3">
      {(["doctor", "hospital", "admin"] as const).map((role) => {
        const active = selectedRole === role;
        const Icon = roleIcons[role];

        return (
          <RoleCard
            key={role}
            selected={active}
            icon={<Icon className="size-5" />}
            title={formatRoleLabel(role)}
            onClick={() => onSelect(role)}
          />
        );
      })}
    </div>
  );
}
