import { cn } from "@/lib/utils";

export interface LoaderProps {
  variant?: "spinner" | "skeleton";
  lines?: number;
  className?: string;
} 

export function Loader({ variant = "spinner", lines = 3, className }: LoaderProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)} aria-label="Loading content" aria-busy="true">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse rounded-full bg-slate-200"
            style={{ width: `${100 - index * 12}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)} aria-label="Loading" aria-busy="true">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  );
}
