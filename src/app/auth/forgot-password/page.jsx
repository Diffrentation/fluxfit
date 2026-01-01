"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OtpSendTo() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Email validation
  const validateEmail = (value) => {
    const emailRegex =
      /^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      toast.success("Forgot password functionality will be available soon!");
      setLoading(false);
      // router.push(`/auth/otp?type=forgot&userId=${userId}`); // Uncomment when API is ready
    }, 1000);
  };

  return (
    <>
      {/* Full Width Header */}
      <header className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12 2xl:py-14 3xl:py-16">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 3xl:px-20">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 3xl:text-9xl font-bold text-neutral-800 dark:text-neutral-200">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                FluxFit
              </span>
            </h1>
          </div>
        </div>
      </header>

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gray-50 dark:bg-black">
        <Toaster position="top-right" />
        <div className="shadow-input mx-auto mt-8 sm:mt-10 md:mt-12 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[70vw] xl:w-[55vw] 2xl:w-[50vw] max-w-5xl rounded-none bg-white p-6 md:rounded-2xl md:p-10 dark:bg-black">
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
              className={`w-full px-4 py-3 border rounded-md outline-none text-neutral-800 dark:text-neutral-200
              ${
                validateEmail(email)
                  ? "border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-300"
                  : "border-red-400 focus:border-red-500 focus:ring-red-300"
              }
              bg-white dark:bg-zinc-900 transition duration-300`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !validateEmail(email)}
            className="group/btn mt-6 relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-700 font-medium text-white dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900"
          >
            {loading ? "Sending..." : "Send OTP →"}
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
          </button>
        </form>
        </div>
      </div>
    </>
  );
}
