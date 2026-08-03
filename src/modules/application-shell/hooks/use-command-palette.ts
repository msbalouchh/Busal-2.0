"use client";

import { useCallback, useEffect, useState } from "react";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);
  const togglePalette = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        togglePalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePalette]);

  return {
    open,
    setOpen,
    openPalette,
    closePalette,
    togglePalette,
  };
}
