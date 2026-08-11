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
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getJwtExpiryMs } from "@/lib/jwtClient";

if (typeof window !== "undefined") {
  axios.defaults.withCredentials = true;
}

const AuthContext = createContext(null);

/** Cross-tab logout signal (storage event fires in other tabs) */
export const AUTH_LOGOUT_STORAGE_KEY = "__fluxfit_auth_logout";
const REFRESH_BUFFER_MS = 60 * 1000;       // Refresh 1 minute before expiry
const REFRESH_RETRY_MS = 30 * 1000;        // Retry after 30s on transient failure
const ACTIVITY_REFRESH_THROTTLE_MS = 10 * 60 * 1000; // Max 1 activity-refresh per 10 min

function isHardAuthFailure(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUserState] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const timerRef = useRef(null);
  const activityRefreshRef = useRef(0);
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

  const scheduleQuickRefreshRetry = useCallback(() => {
    clearExpiryTimer();
    timerRef.current = setTimeout(async () => {
      try {
        await refreshRef.current();
      } catch (error) {
        if (isHardAuthFailure(error)) {
          toast.error("Session expired. Please sign in again.");
          await logoutRef.current();
        }
      }
    }, REFRESH_RETRY_MS);
  }, [clearExpiryTimer]);

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
        localStorage.removeItem("admin_user_view_mode");
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

    // Check if stored token is already expired before restoring it
    const expMs = getJwtExpiryMs(t);
    const isExpired = expMs ? expMs < Date.now() : false;

    startTransition(() => {
      // Only restore token if it is NOT already expired
      if (t && t !== "null" && t !== "undefined" && !isExpired) {
        setAccessToken(t);
      } else if (isExpired) {
        // Token expired — clear stale localStorage, refresh cookie will re-auth
        localStorage.removeItem("token");
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
    if (!hydrated) return;

    // If we have user state but no accessToken (expired token cleared on hydration),
    // immediately try to refresh using the httpOnly refresh cookie.
    if (!accessToken && user) {
      refreshRef.current().catch((error) => {
        if (isHardAuthFailure(error)) {
          // Refresh cookie also expired — full logout
          setUserState(null);
          localStorage.removeItem("user");
        }
      });
      return;
    }

    if (!accessToken) {
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
      } catch (error) {
        if (isHardAuthFailure(error)) {
          toast.error("Session expired. Please sign in again.");
          await logoutRef.current();
          return;
        }
        // Transient issues (network/server hiccups): retry soon without forcing logout.
        scheduleQuickRefreshRetry();
      }
    }, delay);
    return () => clearExpiryTimer();
  }, [hydrated, accessToken, user, clearExpiryTimer, scheduleQuickRefreshRetry]);

  useEffect(() => {
    if (!hydrated || !accessToken) return;

    const maybeRefreshOnActivity = () => {
      const now = Date.now();
      if (now - activityRefreshRef.current < ACTIVITY_REFRESH_THROTTLE_MS) {
        return;
      }
      // Only refresh if token is close to expiry (within 5 minutes)
      const expMs = getJwtExpiryMs(accessToken);
      if (expMs && expMs - Date.now() > 5 * 60 * 1000) {
        return; // Plenty of time left, no need to refresh yet
      }
      activityRefreshRef.current = now;
      refreshRef
        .current()
        .catch((error) => {
          if (isHardAuthFailure(error)) {
            toast.error("Session expired. Please sign in again.");
            logoutRef.current();
          }
        });
    };

    // Only meaningful user actions — removed mousemove/scroll (too noisy)
    const events = ["click", "keydown", "touchstart"];
    events.forEach((eventName) =>
      window.addEventListener(eventName, maybeRefreshOnActivity, { passive: true })
    );

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, maybeRefreshOnActivity)
      );
    };
  }, [hydrated, accessToken]);

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
          url.includes("/api/auth/login") ||
          url.includes("/api/auth/register")
        ) {
          return Promise.reject(error);
        }
        if (original._retry) {
          return Promise.reject(error);
        }

        // A request that never carried a token was never authenticated to
        // begin with (e.g. a guest hitting an account-only endpoint like
        // recently-viewed or wishlist-check). There's no session to refresh
        // or expire, so let it fail silently instead of forcing every guest
        // who triggers a background 401 into a logout + /auth/login redirect.
        if (!original.headers?.Authorization) {
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
        } catch (refreshError) {
          if (isHardAuthFailure(refreshError)) {
            toast.error("Session expired. Please sign in again.");
            await logoutRef.current();
          }
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
