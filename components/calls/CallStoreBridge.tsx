"use client";

import * as React from "react";
import { useDashboardContext } from "@/components/dashboard";
import { useCallStore } from "@/store/callStore";

export function CallStoreBridge() {
  const { currentUser } = useDashboardContext();
  const bootstrap = useCallStore((state) => state.bootstrap);
  const connectRealtime = useCallStore((state) => state.connectRealtime);
  const disconnectRealtime = useCallStore((state) => state.disconnectRealtime);
  const reset = useCallStore((state) => state.reset);

  React.useEffect(() => {
    let active = true;

    const run = async () => {
      connectRealtime(currentUser);

      try {
        await bootstrap(currentUser);
      } catch {
        if (active) {
          disconnectRealtime();
        }
      }
    };

    void run();

    return () => {
      active = false;
      disconnectRealtime();
    };
  }, [bootstrap, connectRealtime, currentUser, disconnectRealtime]);

  React.useEffect(() => () => reset(), [reset]);

  return null;
}
