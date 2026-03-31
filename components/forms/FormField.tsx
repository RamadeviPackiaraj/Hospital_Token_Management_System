import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="ui-label block">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="ui-body text-[#EF4444]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-meta">{hint}</p>
      ) : null}
    </div>
  );
}
