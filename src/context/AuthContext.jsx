"use client";

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { getJwtExpiryMs } from "@/lib/jwtClient";

if (typeof window !== "undefined") {
  axios.defaults.withCredentials = true;
}

const AuthContext = createContext(null);

/** Cross-tab logout signal (storage event fires in other tabs) */
export const AUTH_LOGOUT_STORAGE_KEY = "__fluxfit_auth_logout";
const REFRESH_BUFFER_MS = 60 * 1000;

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const timerRef = useRef(null);
  const refreshInFlightRef = useRef(null);
  const refreshRef = useRef(async () => {});
  const logoutRef = useRef(async () => {});

  const isInitializing = !hydrated;
  const isAuthenticated = Boolean(accessToken && user);

  const clearExpiryTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }
    const p = (async () => {
      const { data } = await axios.post(
        "/api/auth/refresh",
        {},
        {
          withCredentials: true,
          _skipAuthRefresh: true,
        }
      );
      const newToken = data?.data?.accessToken || data?.data?.token;
      if (!newToken) {
        throw new Error("No access token from refresh");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("token", newToken);
      }
      setAccessToken(newToken);
      return newToken;
    })();
    refreshInFlightRef.current = p.finally(() => {
      refreshInFlightRef.current = null;
    });
    return refreshInFlightRef.current;
  }, []);

  const logout = useCallback(
    async (options = {}) => {
      clearExpiryTimer();
      const prevToken =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      setUserState(null);
      setAccessToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.setItem(AUTH_LOGOUT_STORAGE_KEY, String(Date.now()));
      }
      try {
        await axios.post(
          "/api/auth/logout",
          {},
          {
            withCredentials: true,
            headers: prevToken ? { Authorization: `Bearer ${prevToken}` } : {},
            _skipAuthRefresh: true,
          }
        );
      } catch {
        // still clear client state
      }
      if (options.redirect !== false) {
        router.push("/auth/login");
      }
    },
    [clearExpiryTimer, router]
  );

  /**
   * @param {object} userObj - User payload to store
   * @param {string} token - Access JWT
   */
  const login = useCallback((userObj, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userObj));
    }
    setAccessToken(token);
    setUserState(userObj);
  }, []);

  const setUser = useCallback((value) => {
    setUserState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (typeof window !== "undefined") {
        if (next) {
          localStorage.setItem("user", JSON.stringify(next));
        } else {
          localStorage.removeItem("user");
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    refreshRef.current = refreshAccessToken;
    logoutRef.current = logout;
  }, [refreshAccessToken, logout]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    startTransition(() => {
      if (t && t !== "null" && t !== "undefined") {
        setAccessToken(t);
      }
      if (u) {
        try {
          setUserState(JSON.parse(u));
        } catch {
          /* ignore */
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.debug("[Auth]", {
      hydrated,
      isAuthenticated,
      hasToken: !!accessToken,
      userId: user?._id,
      email: user?.email,
    });
  }, [hydrated, isAuthenticated, accessToken, user]);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      clearExpiryTimer();
      return;
    }
    const expMs = getJwtExpiryMs(accessToken);
    if (!expMs) return;
    const delay = Math.max(0, expMs - Date.now() - REFRESH_BUFFER_MS);
    clearExpiryTimer();
    timerRef.current = setTimeout(async () => {
      try {
        await refreshRef.current();
      } catch {
        await logoutRef.current();
      }
    }, delay);
    return () => clearExpiryTimer();
  }, [hydrated, accessToken, clearExpiryTimer]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== AUTH_LOGOUT_STORAGE_KEY || e.newValue == null) return;
      clearExpiryTimer();
      setUserState(null);
      setAccessToken(null);
      router.push("/auth/login");
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
  }, [router, clearExpiryTimer]);

  useEffect(() => {
    const reqId = axios.interceptors.request.use((config) => {
      config.withCredentials = true;
      if (typeof window !== "undefined") {
        const t = localStorage.getItem("token");
        if (t && t !== "null" && t !== "undefined") {
          config.headers.Authorization = `Bearer ${t}`;
        }
      }
      return config;
    });

    const resId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (!original || original._skipAuthRefresh) {
          return Promise.reject(error);
        }
        if (error.response?.status !== 401) {
          return Promise.reject(error);
        }
        const url = original.url || "";
        if (
          url.includes("/api/auth/refresh") ||
          url.includes("/api/auth/login")
        ) {
          return Promise.reject(error);
        }
        if (original._retry) {
          return Promise.reject(error);
        }
        original._retry = true;
        try {
          await refreshRef.current();
          const t =
            typeof window !== "undefined" ? localStorage.getItem("token") : null;
          original.headers = original.headers || {};
          if (t) {
            original.headers.Authorization = `Bearer ${t}`;
          }
          return axios(original);
        } catch {
          await logoutRef.current();
          return Promise.reject(error);
        }
      }
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated,
      isInitializing,
      hydrated,
      login,
      logout,
      setUser,
      refreshAccessToken,
    }),
    [
      user,
      accessToken,
      isAuthenticated,
      isInitializing,
      hydrated,
      login,
      logout,
      setUser,
      refreshAccessToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
