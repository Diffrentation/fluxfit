"use client";
import React, { Suspense, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

function Login() {
  const { login: authLogin } = useAuth();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      setLoading(true);
  
      const response = await axios.post("/api/auth/login", {
        emailOrUsername: email,
        password,
      });
  
      if (response?.data?.success) {
        toast.success(response?.data?.message || "Login successful ✅");

        const token =
          response?.data?.data?.accessToken || response?.data?.data?.token;
        const userPayload = response?.data?.data?.user;
        if (token && userPayload) {
          authLogin(token, userPayload);
        }

        router.push("/");
        return;
      }
  
      toast.error(response?.data?.message || "Login failed");
    } catch (error) {
      // ✅ if not verified redirect to otp
      if (error?.response?.status === 403) {
        toast.error("Please verify your email first!");
        const userId = error?.response?.data?.data?.userId;
        if (userId) router.push(`/auth/otp?type=register&userId=${userId}`);
        return;
      }
  
      toast.error(error?.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignup = () => router.push("/auth/register");
  const handleforgotPass = () => router.push("/auth/forgot-password");

  return (
    <div
      className="
        shadow-input mx-auto mt-20 sm:mt-24 md:mt-26
        w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[70vw] xl:w-[55vw] 2xl:w-[50vw]
        max-w-5xl rounded-lg sm:rounded-xl md:rounded-2xl bg-white p-4 sm:p-6 md:p-8 lg:p-10 dark:bg-black
      "
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        {!logoError ? (
          <>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-400 dark:text-gray-400">
              <span className="text-gray-500 dark:text-gray-400">
                Welcome Back to{" "}
              </span>{" "}
              FluxFit
            </h2>
          </>
        ) : (
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
            FluxFit
          </h2>
        )}
      </div>
      <form className="mt-8" onSubmit={handleSubmit}>
        <LabelInputContainer>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mt-4 relative">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute top-1/2 right-4 cursor-pointer"
          >
            {showPass ? <FaRegEye /> : <FaRegEyeSlash />}
          </button>
        </LabelInputContainer>

        <p
          className="text-right text-sm text-blue-600 cursor-pointer mt-2"
          onClick={handleforgotPass}
        >
          Forgot Password?
        </p>

        <button
          className="group/btn mt-6 relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-700 font-medium text-white"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in →"}
          <BottomGradient />
        </button>

        <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mt-6">
          Don&apos;t have an account?{" "}
          <span
            className="underline cursor-pointer text-blue-600"
            onClick={handleSignup}
          >
            Sign up
          </span>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
          Loading…
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>
    {children}
  </div>
);
