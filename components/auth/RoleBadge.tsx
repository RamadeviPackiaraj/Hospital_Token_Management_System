import { AuthRole, formatRoleLabel, getRoleTheme } from "@/lib/auth-flow";

export function RoleBadge({
  role,
  prefix,
  className = ""
}: {
  role: AuthRole;
  prefix?: string;
  className?: string;
}) {
  const theme = getRoleTheme(role);

  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#F8FAFC" }}
    >
      <span>{prefix ? `${prefix} ${formatRoleLabel(role)}` : formatRoleLabel(role)}</span>
    </div>
  );
}
