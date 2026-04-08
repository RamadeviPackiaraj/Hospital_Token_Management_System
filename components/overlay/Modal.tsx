"use client";

import * as React from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  hideHeader?: boolean;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  className,
  bodyClassName,
  footerClassName,
  hideHeader = false,
}: ModalProps) {
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className={`relative z-10 w-full max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-panel ${className || ""}`}>
        {!hideHeader ? (
          <div className="mb-5">
            <h2 id={titleId} className="ui-section-title">
              {title}
            </h2>
            {description ? <p className="mt-2 ui-body-secondary">{description}</p> : null}
          </div>
        ) : (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        )}
        <div className={bodyClassName}>{children}</div>
        {footer ? <div className={`mt-6 flex flex-wrap justify-end gap-3 ${footerClassName || ""}`}>{footer}</div> : null}
      </div>
    </div>
  );
}
