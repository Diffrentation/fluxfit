"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { IconMail, IconArrowRight, IconShieldLock } from "@tabler/icons-react";
import AuthLayout from "@/components/auth/AuthLayout";

export default function OtpSendTo() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // General email shape
  const validateEmail = (value) => {
    const emailRegex =
      /^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  };

  /**
   * Stricter checks when the domain is @gmail.com (Google username rules, simplified).
   * Returns an error message or null if OK / not a Gmail address.
   */
  const getGmailValidationMessage = (value) => {
    const t = value.trim();
    if (!t) return null;
    if (!/@gmail\.com\s*$/i.test(t)) return null;

    const match = t.match(/^(.+)@gmail\.com$/i);
    if (!match) return "Invalid Gmail address format.";
    const local = match[1].toLowerCase();

    if (local.length < 6 || local.length > 30) {
      return "Gmail usernames must be between 6 and 30 characters before @gmail.com.";
    }
    if (local.startsWith(".") || local.endsWith(".")) {
      return "Gmail username cannot start or end with a dot.";
    }
    if (local.includes("..")) {
      return "Gmail username cannot contain consecutive dots (..).";
    }
    if (!/^[a-z0-9.+_-]+$/.test(local)) {
      return "Gmail username can only include letters, numbers, dots, +, _, and hyphen.";
    }
    if (!/^[a-z0-9]/.test(local) || !/[a-z0-9]$/.test(local)) {
      return "Gmail username must start and end with a letter or number.";
    }

    return null;
  };

  const gmailIssue = email.trim() ? getGmailValidationMessage(email) : null;
  const emailLooksValid =
    email.trim().length > 0 && validateEmail(email) && !gmailIssue;

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const gmailMsg = getGmailValidationMessage(email);
    if (gmailMsg) {
      toast.error(gmailMsg);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/forgot-password",{
        email: email,
        method: "email"
      })
      if (response?.data?.success) {
        toast.success(response?.data?.message || "OTP sent successfully");
        router.push(`/auth/otp?type=password-reset&userId=${response?.data?.data?.userId}`);
      } else {
        toast.error(response?.data?.message || "Forgot password failed. Please try again.");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error?.response?.data?.message || "Forgot password failed. Please try again.");
    } finally {
      setLoading(false);
    }

  };

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
            <IconShieldLock className="w-5 h-5 text-[#1e9a58]" />
          </div>
          <h2 className="text-xl font-bold text-[#111827]">Forgot Password</h2>
          <div className="flex-1 h-px bg-gray-100 ml-4"></div>
        </div>

        <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
          Enter your registered email to receive a one-time password (OTP) to reset your password.
        </p>

        <form onSubmit={handleSendOtp} className="space-y-6">
          <div className="flex flex-col space-y-1.5 mb-8">
            <Label htmlFor="email" className="text-sm font-bold text-gray-700 mb-1">
              Email Address
            </Label>
            <div className="relative">
              <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                aria-invalid={email.trim().length > 0 && !emailLooksValid}
                className={`w-full pl-11 h-12 bg-white border border-gray-200 rounded-xl text-base outline-none text-neutral-800 transition duration-300
                ${
                  !email.trim() || emailLooksValid
                    ? "focus-visible:ring-[#1e9a58]"
                    : "border-amber-500 focus-visible:ring-amber-500"
                }
                bg-white`}
              />
            </div>
            {gmailIssue && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2" role="alert">
                {gmailIssue}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !validateEmail(email) || Boolean(gmailIssue)}
            className="w-full bg-[#1e9a58] hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(30,154,88,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send OTP"} <IconArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
