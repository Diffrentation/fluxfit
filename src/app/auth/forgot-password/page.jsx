"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

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
        toast.success(response?.data?.data?.message);
        router.push(`/auth/otp?type=password-reset&userId=${response?.data?.data?.userId}`);
      } else {
        toast.error(response?.data?.data?.message);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error?.response?.data?.data?.message || "Forgot password failed. Please try again.");
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-black">
      <div className="shadow-input mx-auto w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[70vw] xl:w-[55vw] 2xl:w-[50vw] max-w-5xl rounded-none bg-white p-6 md:rounded-2xl md:p-10 dark:bg-black">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
          Forgot Password
        </h2>

        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          Enter your registered email to receive a one-time password (OTP) to reset your password.
        </p>

        <form className="mt-8" onSubmit={handleSendOtp}>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="email" className="text-neutral-800 dark:text-neutral-200">
              Email Address
            </Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              aria-invalid={email.trim().length > 0 && !emailLooksValid}
              className={`w-full px-4 py-3 border rounded-md outline-none text-neutral-800 dark:text-neutral-200
              ${
                !email.trim() || emailLooksValid
                  ? "border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300"
                  : "border-amber-500 focus:border-amber-600 focus:ring-amber-300 dark:border-amber-600"
              }
              bg-white dark:bg-zinc-900 transition duration-300`}
            />
            {gmailIssue && (
              <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
                {gmailIssue}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !validateEmail(email) || Boolean(gmailIssue)}
            className="group/btn mt-6 relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-700 font-medium text-white dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900"
          >
            {loading ? "Sending..." : "Send OTP →"}
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
          </button>
        </form>
      </div>
    </div>
  );
}
