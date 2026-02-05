export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const API_BASE =
  (import.meta.env as any)?.VITE_API_BASE_URL || "/api";

export const getLoginUrl = () => {
  const state = window.location.href;
  return `${API_BASE}/oauth/google/login?state=${encodeURIComponent(state)}`;
};
