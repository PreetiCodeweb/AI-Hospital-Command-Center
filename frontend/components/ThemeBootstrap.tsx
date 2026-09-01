"use client";

import { useEffect } from "react";

export function ThemeBootstrap() {
  useEffect(() => {
    const root = document.documentElement;
    const theme = window.localStorage.getItem("medsync-theme") || "dark";
    root.dataset.theme = theme;

    try {
      const settings = JSON.parse(
        window.localStorage.getItem("medsync-settings") || "{}",
      );
      root.dataset.compact = settings.toggles?.compactMode ? "true" : "false";
      root.dataset.reducedMotion = settings.toggles?.reducedMotion
        ? "true"
        : "false";
      root.dataset.chartDensity = (
        settings.chartDensity || "Balanced"
      ).toLowerCase();
      root.dataset.accentIntensity = (settings.accentIntensity || "Operational")
        .toLowerCase()
        .replace(" ", "-");
    } catch {
      root.dataset.compact = "false";
      root.dataset.reducedMotion = "false";
      root.dataset.chartDensity = "balanced";
      root.dataset.accentIntensity = "operational";
    }
  }, []);

  return null;
}
