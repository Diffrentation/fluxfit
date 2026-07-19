"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { IconMail, IconLock, IconEye, IconEyeOff, IconArrowRight, IconUser } from "@tabler/icons-react";
import AuthLayout from "@/components/auth/AuthLayout";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import GuestRoute from "@/components/auth/GuestRoute";

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
          authLogin(userPayload, token);
        }

        const pendingContactMessage = sessionStorage.getItem("pendingContactMessage");
        if (pendingContactMessage) {
          try {
            const parsedMessage = JSON.parse(pendingContactMessage);
            const { data } = await axios.post("/api/contact", parsedMessage, {
              _skipGlobalToast: true,
            });
            if (data?.success) {
              toast.success("Message sent successfully!");
              sessionStorage.removeItem("pendingContactMessage");
            } else {
              toast.error(data?.message || "Could not send pending message.");
            }
          } catch (err) {
            console.error("Failed to send pending message", err);
            toast.error("Failed to send pending message.");
          }
          router.push("/contact");
          return;
        }

        router.push("/");
        return;
      }

      toast.error(
        typeof response?.data?.message === "string"
          ? response.data.message
          : "Login failed"
      );
    } catch (error) {
      if (error?.response?.status === 403) {
        toast.error("Please verify your email first!");
        const userId = error?.response?.data?.data?.userId;
        if (userId) router.push(`/auth/otp?type=register&userId=${userId}`);
        return;
      }
      // 401 / 400 / network: GlobalAxiosToasts already shows toast.error
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignup = () => router.push("/auth/register");
  const handleforgotPass = () => router.push("/auth/forgot-password");

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconUser className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <h2 className="text-xl font-bold text-[#111827]">Welcome Back</h2>
            <div className="flex-1 h-px bg-gray-100 ml-4"></div>
          </div>
          
          <LabelInputContainer className="mb-5">
            <Label htmlFor="email" className="text-sm font-bold text-gray-700 mb-1">Email Address</Label>
            <div className="relative">
              <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
              />
            </div>
          </LabelInputContainer>

          <LabelInputContainer className="mb-2">
            <Label htmlFor="password" className="text-sm font-bold text-gray-700 mb-1">Password</Label>
            <div className="relative">
              <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-11 pr-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <IconEye className="w-5 h-5" /> : <IconEyeOff className="w-5 h-5" />}
              </button>
            </div>
          </LabelInputContainer>

          <div className="flex justify-end mb-8">
            <button
              type="button"
              className="text-sm font-bold text-[#1e9a58] hover:underline"
              onClick={handleforgotPass}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          disabled={loading}
          className="w-full bg-[#1e9a58] hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(30,154,88,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
        >
          {loading ? "Logging in..." : "Log in"} <IconArrowRight className="w-5 h-5" />
        </button>

        <div className="w-full h-px bg-gray-100 my-6"></div>
        
        <p className="text-center text-sm font-medium text-gray-500">
          Don't have an account?{" "}
          <button
            type="button"
            className="font-bold text-[#1e9a58] hover:underline ml-1"
            onClick={handleSignup}
          >
            Sign up
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-1.5", className)}>
    {children}
  </div>
);

export default function LoginPage() {
  return (
    <GuestRoute>
      <Login />
    </GuestRoute>
  );
}


