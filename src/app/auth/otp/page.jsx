"use client";

import React, { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { IconShieldCheck, IconArrowRight, IconRefresh } from "@tabler/icons-react";
import AuthLayout from "@/components/auth/AuthLayout";

function OTPPageContent() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Get userId and type directly from URL
  const userId = searchParams?.get("userId");
  const type = searchParams?.get("type") || "register"; // "register" | "email-verification" | "password-reset"

  // Normalize whatever the URL/redirect gave us into a value the OTP schema
  // actually accepts — both verify and resend must use this, not the raw type.
  const apiType = type === "password-reset" ? "password-reset" : "email-verification";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  // ✅ resend states
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  // ✅ timer countdown
  useEffect(() => {
    // start countdown on page load
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(""));
      const lastInput = document.getElementById(`otp-5`);
      if (lastInput) lastInput.focus();
    }
  };

  // ✅ VERIFY OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) return toast.error("User not found. Please signup again.");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) return toast.error("Please enter complete OTP");

    try {
      setLoading(true);

      const response = await axios.post("/api/auth/verify-otp", {
        userId,
        otp: otpValue,
        type:apiType,
      });

      if (response?.data?.success) {
        const token =
          response?.data?.data?.accessToken ||
          response?.data?.data?.token ||
          response?.data?.token;
        const user = response?.data?.data?.user || response?.data?.user;

        if (token && user) {
          authLogin(user, token);
        } else if (token) {
          localStorage.setItem("token", token);
        }

        toast.success(response?.data?.message || "OTP verified successfully ✅");

        // ✅ redirect
        if(type === "password-reset") {
          const resetToken = response?.data?.data?.resetToken;
          if (resetToken) {
            sessionStorage.setItem(`resetToken:${userId}`, resetToken);
          }
          router.push("/auth/change-password?userId=" + userId);
        } else {
          router.push("/auth/login");
        }
      } else {
        toast.error(response?.data?.message || "Invalid OTP");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ RESEND OTP
  const handleResendOtp = async () => {
    if (!userId) return toast.error("User not found. Please signup again.");

    try {
      setResendLoading(true);

      const response = await axios.post("/api/auth/resend-otp", {
        userId,
        type: apiType,
      });

      if (response?.data?.success) {
        toast.success(response?.data?.message || "OTP resent ✅");
        setTimer(60); // ✅ restart timer after resend
      } else {
        toast.error(response?.data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
            <IconShieldCheck className="w-5 h-5 text-[#1e9a58]" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">Enter OTP</h2>
          <div className="flex-1 h-px bg-gray-100 ml-4"></div>
        </div>

        <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
          OTP has been sent to your email. Please enter it below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">OTP Code</label>

            <div className="flex justify-between gap-2 sm:gap-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 text-xl font-bold text-center bg-white border border-gray-200 rounded-xl outline-none transition-all",
                    "focus-visible:ring-[#1e9a58] focus-visible:border-[#1e9a58]",
                    "dark:bg-zinc-800 dark:text-white dark:border-gray-600"
                  )}
                />
              ))}
            </div>
          </div>

          {/* ✅ Verify Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full bg-[#1e9a58] hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(30,154,88,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify OTP"} <IconArrowRight className="w-5 h-5" />
          </button>

          {/* ✅ Resend Section */}
          <div className="flex flex-col items-center gap-3 mt-6">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || timer > 0}
              className={cn(
                "w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                timer > 0 
                  ? "border-gray-200 text-gray-400 bg-gray-50" 
                  : "border-[#1e9a58] text-[#1e9a58] hover:bg-[#f4fbf7]"
              )}
            >
              <IconRefresh className="w-5 h-5" />
              {resendLoading
                ? "Resending..."
                : timer > 0
                ? `Resend OTP in ${timer}s`
                : "Resend OTP"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Didn’t receive OTP? Check spam folder or resend after timer ends.
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

function OTPFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg font-semibold text-gray-600">Preparing OTP form…</p>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function OTPPage() {
  return (
    <Suspense fallback={<OTPFallback />}>
      <OTPPageContent />
    </Suspense>
  );
}
