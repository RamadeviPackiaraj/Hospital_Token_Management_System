import { cn } from "@/lib/utils";

export interface FormWrapperProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
}

export function FormWrapper({
  title,
  description,
  children,
  className,
  ...props
}: FormWrapperProps) {
  return (
    <form
      className={cn("space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-panel", className)}
      {...props}
    >
      {title || description ? (
        <div>
          {title ? <h2 className="text-lg font-semibold text-slate-950">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </form>
  );
}
