import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@shared/types";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

type UseAuthState = {
  user: User | null;
  loading: boolean;
  error: unknown;
  isAuthenticated: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    setLoading(true);
    api.get("/auth/me")
      .then(res => {
        setUser(res.data);
        setError(null);
      })
      .catch(err => {
        setUser(null);
        setError(err);
        if (redirectOnUnauthenticated) {
          window.location.href = redirectPath;
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [redirectOnUnauthenticated, redirectPath]);

  const logout = useCallback(async () => {
    try {
      await api.get("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    refresh: async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
        setError(null);
      } catch (err) {
        setUser(null);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    logout,
  };
}
