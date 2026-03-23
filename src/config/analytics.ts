export type AnalyticsProvider = "gtag" | "gtm" | "mp";
export type AnalyticsLoadStrategy = "immediate" | "idle" | "interaction";
import { analyticsData } from "./analytics.data";

export interface AnalyticsConfig {
  enabled: boolean;
  provider: AnalyticsProvider;
  measurementId?: string;
  gtmContainerId?: string;
  loadStrategy: AnalyticsLoadStrategy;
  requireConsent: boolean;
  debug: boolean;
  siteName: string;
  environment: string;
}

export const analyticsConfig: AnalyticsConfig = {
  ...analyticsData,
  environment: import.meta.env.MODE,
};

export const analyticsIsConfigured =
  analyticsConfig.enabled &&
  ((analyticsConfig.provider === "gtag" && !!analyticsConfig.measurementId) ||
    (analyticsConfig.provider === "gtm" && !!analyticsConfig.gtmContainerId) ||
    analyticsConfig.provider === "mp");
