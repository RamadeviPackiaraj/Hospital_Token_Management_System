import * as React from "react";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function useTimer(resetKey: string | null, isRunning: boolean) {
  const [seconds, setSeconds] = React.useState(0);
  const startedAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    startedAtRef.current = Date.now();
    setSeconds(0);
  }, [resetKey]);

  React.useEffect(() => {
    if (!isRunning || !resetKey) {
      return;
    }

    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
    }

    const intervalId = window.setInterval(() => {
      const startedAt = startedAtRef.current ?? Date.now();
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, resetKey]);

  return {
    seconds,
    formatted: formatDuration(seconds),
  };
}
