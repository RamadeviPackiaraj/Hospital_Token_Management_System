"use client";

import * as React from "react";

export function useToggle(initialState = false) {
  const [value, setValue] = React.useState(initialState);

  const toggle = React.useCallback(() => {
    setValue((current) => !current);
  }, []);

  return [value, toggle, setValue] as const;
}
