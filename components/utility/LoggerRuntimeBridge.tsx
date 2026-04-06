"use client";

import * as React from "react";
import { flushQueuedRemoteLogs, logger } from "@/lib/logger";

function normalizeUnknownError(value: unknown) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === "string") {
    return { message: value };
  }

  return value;
}

export function LoggerRuntimeBridge() {
  React.useEffect(() => {
    flushQueuedRemoteLogs();

    const handleWindowError = (event: ErrorEvent) => {
      logger.error(event.message || "Unhandled window error", {
        source: "window.error",
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: normalizeUnknownError(event.error),
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error("Unhandled promise rejection", {
        source: "window.unhandledrejection",
        data: {
          reason: normalizeUnknownError(event.reason),
        },
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
