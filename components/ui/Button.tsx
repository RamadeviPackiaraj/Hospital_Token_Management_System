"use client";

import * as React from "react";
import { buttonIconSizes, buttonSizeStyles, buttonVariants } from "@/lib/variants";
import { cn } from "@/lib/utils";

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizeStyles;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

function Spinner({ size }: { size: ButtonSize }) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent",
        buttonIconSizes[size]
      )}
      aria-hidden="true"
    />
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    children,
    leftIcon,
    rightIcon,
    loading = false,
    disabled = false,
    fullWidth = false,
    type = "button",
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  const hasText = React.Children.count(children) > 0;
  const isIconOnly = !hasText && Boolean(leftIcon || rightIcon);
  const icon = leftIcon ?? rightIcon;

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "focus-ring relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium leading-5 transition-colors duration-200",
        "disabled:pointer-events-none disabled:opacity-60",
        buttonVariants[variant],
        buttonSizeStyles[size],
        fullWidth && "w-full",
        isIconOnly && "aspect-square px-0",
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size} />
          {hasText ? <span className="truncate">{children}</span> : null}
        </>
      ) : isIconOnly ? (
        <span className={cn("inline-flex items-center justify-center", buttonIconSizes[size])}>
          {icon}
        </span>
      ) : (
        <>
          {leftIcon ? (
            <span className={cn("inline-flex items-center justify-center", buttonIconSizes[size])}>
              {leftIcon}
            </span>
          ) : null}
          {hasText ? <span className="truncate">{children}</span> : null}
          {rightIcon ? (
            <span className={cn("inline-flex items-center justify-center", buttonIconSizes[size])}>
              {rightIcon}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
});
