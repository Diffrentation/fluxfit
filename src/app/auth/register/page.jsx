"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  IconUser,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconPhone,
  IconArrowRight,
} from "@tabler/icons-react";
import AuthLayout from "@/components/auth/AuthLayout";
import toast from "react-hot-toast";
import axios from "axios";
import GuestRoute from "@/components/auth/GuestRoute";

function Signup() {
  const [showPass, setShowPass] = useState(false);
  const type = "email-verification";


  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

    // now integrate the api call to register the user
    const registerUser = async (formData) => {
      try {
        setLoading(true);
    
        const data = new FormData();
        data.append("firstname", formData.firstname);
        data.append("lastname", formData.lastname);
        data.append("email", formData.email);
        data.append("password", formData.password);
        data.append("phone", formData.phone);
    
    
        const response = await axios.post("/api/auth/register", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
    
        // ✅ success toast
        if (response.data.success) {
          toast.success(response.data.message || "Registered ✅");
        } else {
          const m = response.data?.message;
          toast.error(
            typeof m === "string" ? m : "Registration could not be completed"
          );
        }
    
        return response; // ✅ MOST IMPORTANT (without this redirect will never work)
    
      } catch {
        // Error toast: GlobalAxiosToasts (login + register)
        return null;
      } finally {
        setLoading(false);
      }
    };
      
  const handleChange = (e) => {
    const { id, value } = e.target;

    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // ✅ validate
    if (
      !formData.firstname ||
      !formData.lastname ||
      !formData.email ||
      !formData.password ||
      !formData.phone
    ) {
      toast.error("Please complete all required fields");
      return;
    }
  
    // ✅ call api
    const response = await registerUser(formData);
  
    // ✅ redirect
    if (response?.data?.success) {
      const userId = response?.data?.data?.user?.id;
  
      if (!userId) {
        toast.error("userId missing in response!");
        return;
      }
  
      router.push(`/auth/otp?type=${type}&userId=${userId}`);
    }
  };
  
  const handleLogin = () => router.push("/auth/login");

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        
        {/* Section: Personal Information */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconUser className="w-[20px] h-[20px] text-[#1e9a58]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111827]">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <LabelInputContainer>
              <Label htmlFor="firstname" className="text-sm font-semibold text-gray-700 mb-1.5">First Name</Label>
              <div className="relative group">
                <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="John"
                  type="text"
                  required
                  className="pl-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="lastname" className="text-sm font-semibold text-gray-700 mb-1.5">Last Name</Label>
              <div className="relative group">
                <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Doe"
                  type="text"
                  required
                  className="pl-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer className="col-span-1 md:col-span-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-1.5">Email</Label>
              <div className="relative group">
                <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="pl-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 mb-1.5">Password</Label>
              <div className="relative group">
                <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] font-mono tracking-wider transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <IconEye className="w-[18px] h-[18px]" /> : <IconEyeOff className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-1.5">Phone Number</Label>
              <div className="relative group">
                <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter phone number"
                  required
                  className="pl-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
              </div>
            </LabelInputContainer>
          </div>
        </div>

        {/* Submit Section */}
        <div className="pt-2">
          <button
            disabled={loading}
            className="w-full md:w-[320px] md:mx-auto bg-[#1e9a58] hover:bg-green-700 text-white font-semibold text-[15px] h-12 rounded-[14px] flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            type="submit"
          >
            {loading ? "Creating Account..." : "Create Account"} <IconArrowRight className="w-[18px] h-[18px] group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-center text-sm font-medium text-gray-500 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              className="font-bold text-[#1e9a58] hover:underline hover:text-green-700 ml-1 transition-colors"
              onClick={handleLogin}
            >
              Login
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

const LabelInputContainer = ({ children, className }) => (
  <div className={cn("flex w-full flex-col space-y-1.5", className)}>
    {children}
  </div>
);

export default function RegisterPage() {
  return (
    <GuestRoute>
      <Signup />
    </GuestRoute>
  );
}
