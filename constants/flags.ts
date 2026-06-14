// Feature flags.
//
// PAYWALL_ENABLED ships OFF for v1.0 — the paywall screen exists and is route-
// registered, but nothing navigates to it and no IAP is wired. For 1.1, flip
// this to true, add the entry points (e.g. a Profile "Go Plus" row), and wire
// real StoreKit / RevenueCat purchases in app/paywall.tsx (see the TODOs there).
export const PAYWALL_ENABLED = false;
