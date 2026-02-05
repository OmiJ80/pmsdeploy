import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getLoginUrl, API_BASE } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = async (error: unknown) => {
  if (!error || typeof window === "undefined") return;
  const message = (error as any)?.message ?? (error as any)?.data?.message;
  if (typeof window === "undefined") return;

  const isUnauthorized = message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  const state = encodeURIComponent(window.location.href);
  const url = `${API_BASE}/oauth/google/login?state=${state}&json=1`;
  try {
    const resp = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const data = await resp.json();
    if (data && data.url) {
      window.location.href = data.url;
      return;
    }
  } catch {}
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
