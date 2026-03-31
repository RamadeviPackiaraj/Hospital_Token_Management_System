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
      className={cn("ui-card space-y-4", className)}
      {...props}
    >
      {title || description ? (
        <div>
          {title ? <h2 className="ui-section-title">{title}</h2> : null}
          {description ? <p className="mt-1 ui-body-secondary">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </form>
  );
}
