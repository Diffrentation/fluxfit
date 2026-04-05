"use client";

import { useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/appToast";

/**
 * Global axios toasts: errors (and optional success) for the whole app.
 * - Set `config._skipGlobalToast = true` to silence both.
 * - Set `config.toastSuccess = true` to show toast.success when API returns { success, message } on POST/PUT/PATCH/DELETE.
 */
export default function GlobalAxiosToasts() {
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => {
        const cfg = response.config || {};
        if (cfg._skipGlobalToast) return response;

        if (cfg.toastSuccess === true) {
          const method = String(cfg.method || "").toLowerCase();
          if (["post", "put", "patch", "delete"].includes(method)) {
            const data = response.data;
            if (
              data &&
              data.success === true &&
              typeof data.message === "string" &&
              data.message.trim()
            ) {
              toast.success(data.message.trim());
            }
          }
        }
        return response;
      },
      (error) => {
        if (axios.isCancel?.(error) || error.code === "ERR_CANCELED") {
          return Promise.reject(error);
        }
        const cfg = error.config || {};
        if (cfg._skipGlobalToast) {
          return Promise.reject(error);
        }

        const reqUrl = String(cfg.url || "");
        const status = error.response?.status;

        // Login / register: show error toast here (pages were easy to miss; other /api/auth/* stay silent).
        if (reqUrl.includes("/api/auth/")) {
          const isLogin = reqUrl.includes("/api/auth/login");
          const isRegister = reqUrl.includes("/api/auth/register");
          if (isLogin || isRegister) {
            // Login 403 = unverified email; page shows a specific toast + OTP redirect.
            if (isLogin && status === 403) {
              return Promise.reject(error);
            }
            const text = getErrorMessage(
              error,
              isLogin ? "Invalid login credentials" : "Could not create account"
            );
            toast.error(text);
            return Promise.reject(error);
          }
          return Promise.reject(error);
        }

        // Auth refresh, session expiry, etc. — handled in AuthContext (toasts there).
        if (status === 401) {
          return Promise.reject(error);
        }

        const text = getErrorMessage(error, "Request failed");
        toast.error(text);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(id);
    };
  }, []);

  return null;
}
