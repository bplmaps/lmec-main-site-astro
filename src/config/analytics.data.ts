import type { AnalyticsConfig } from "./analytics";

// Update this file directly to change provider, IDs, and load behavior.
export const analyticsData: Omit<AnalyticsConfig, "environment"> = {
  enabled: true,
  provider: "gtag",
  measurementId: "G-LNXLT4M6B9",
  gtmContainerId: "",
  loadStrategy: "idle",
  requireConsent: false,
  debug: false,
  siteName: "LMEC Main Site",
};
