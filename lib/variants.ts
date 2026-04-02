export const buttonVariants = {
  primary:
    "border border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm hover:bg-[#0b8b8b] hover:border-[#0b8b8b] active:bg-[#0f8a89] focus-visible:ring-[var(--primary)]",
  secondary:
    "border border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[#F0FDFA] active:bg-[#CCFBF1] focus-visible:ring-[var(--primary)]",
  outline:
    "border border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[#F0FDFA] active:bg-[#CCFBF1] focus-visible:ring-[var(--primary)]",
  tertiary:
    "bg-transparent text-[var(--primary)] hover:bg-[#F0FDFA] active:bg-[#CCFBF1] focus-visible:ring-[var(--primary)]",
  ghost:
    "bg-transparent text-[var(--text)] hover:bg-[#f1f5f9] active:bg-[#E2E8F0] focus-visible:ring-[var(--primary)]",
  danger:
    "border border-[var(--error)] bg-[var(--error)] text-white shadow-sm hover:bg-[#dc2626] hover:border-[#dc2626] active:bg-[#b91c1c] focus-visible:ring-[var(--error)]",
  success:
    "border border-[var(--success)] bg-[var(--success)] text-white shadow-sm hover:bg-[#16a34a] hover:border-[#16a34a] active:bg-[#15803d] focus-visible:ring-[var(--success)]",
  successOutline:
    "border border-[var(--success)] bg-white text-[var(--success)] hover:bg-[#F0FDF4] active:bg-[#DCFCE7] focus-visible:ring-[var(--success)]",
  dangerOutline:
    "border border-[var(--error)] bg-white text-[var(--error)] hover:bg-[#FEF2F2] active:bg-[#FEE2E2] focus-visible:ring-[var(--error)]"
} as const;

export const buttonSizeStyles = {
  sm: "h-9 px-3.5 text-sm font-medium",
  md: "h-11 px-4 text-sm font-medium",
  lg: "h-12 px-5 text-sm font-medium"
} as const;

export const buttonIconSizes = {
  sm: "size-4",
  md: "size-[18px]",
  lg: "size-5"
} as const;

export const badgeVariants = {
  neutral: "bg-[#F8FAFC] text-[#64748B] ring-[#E2E8F0]",
  info: "bg-[#F0FDFA] text-[#0EA5A4] ring-[#99F6E4]",
  success: "bg-[#DCFCE7] text-[#15803D] ring-[#BBF7D0]",
  warning: "bg-[#FEF9C3] text-[#CA8A04] ring-[#FDE68A]",
  error: "bg-[#FEE2E2] text-[#DC2626] ring-[#FECACA]"
} as const;
