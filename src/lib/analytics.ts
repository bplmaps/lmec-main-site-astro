declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsEventName =
  | "search_result_click"
  | "donate_click"
  | "newsletter_signup"
  | "event_registration";

export interface AnalyticsEventParams {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
}

export const analyticsEventTaxonomy: Record<
  AnalyticsEventName,
  AnalyticsEventParams
> = {
  search_result_click: { category: "engagement" },
  donate_click: { category: "conversion" },
  newsletter_signup: { category: "conversion" },
  event_registration: { category: "conversion" },
};

export function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {},
) {
  if (typeof window === "undefined") return;

  const mergedParams = {
    ...analyticsEventTaxonomy[eventName],
    ...params,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, mergedParams);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...mergedParams });
  }
}
