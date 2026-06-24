"use client";
import React, { useState, useRef } from "react";
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
  IconMapPin,
  IconBuilding,
  IconMap,
  IconWorld,
  IconPin,
  IconShieldCheck,
  IconRosetteDiscountCheck,
  IconHeadset,
  IconArrowRight,
  IconChevronDown,
} from "@tabler/icons-react";
import AuthLayout from "@/components/auth/AuthLayout";
import toast from "react-hot-toast";
import { useEffect } from "react";
import axios from "axios";
import GuestRoute from "@/components/auth/GuestRoute";

function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [logoError, setLogoError] = useState(false);
  const fileInputRef = useRef(null);
  const [type, setType] = useState("email-verification");


  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    phone: "",
    address: {
      city: "",
      state: "",
      country: "India",
      pincode: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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
    
        data.append("address.city", formData.address.city);
        data.append("address.state", formData.address.state);
        data.append("address.country", formData.address.country);
        data.append("address.pincode", formData.address.pincode);
    
        // ✅ image optional
        if (selectedFile) {
          data.append("profileimage", selectedFile);
        }
    
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

    if (id.startsWith("address.")) {
      const addressField = id.split(".")[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [id]: value,
      });
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setSelectedFile(file);

    toast.success("Profile image selected");
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
      !formData.phone ||
      !formData.address.city ||
      !formData.address.state ||
      !formData.address.pincode
    ) {
      toast.error("All fields including address are required");
      return;
    }
  
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.address.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
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
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        
        {/* Section: Personal Information */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconUser className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <h2 className="text-xl font-bold text-[#111827]">Personal Information</h2>
            <div className="flex-1 h-px bg-gray-100 ml-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <LabelInputContainer>
              <Label htmlFor="firstname" className="text-sm font-bold text-gray-700 mb-1">First Name</Label>
              <div className="relative">
                <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="John"
                  type="text"
                  required
                  className="pl-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="lastname" className="text-sm font-bold text-gray-700 mb-1">Last Name</Label>
              <div className="relative">
                <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Doe"
                  type="text"
                  required
                  className="pl-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
              </div>
            </LabelInputContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <LabelInputContainer>
              <Label htmlFor="email" className="text-sm font-bold text-gray-700 mb-1">Email</Label>
              <div className="relative">
                <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="pl-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="password" className="text-sm font-bold text-gray-700 mb-1">Password</Label>
              <div className="relative">
                <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-11 pr-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base font-mono tracking-widest"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <IconEye className="w-5 h-5" /> : <IconEyeOff className="w-5 h-5" />}
                </button>
              </div>
            </LabelInputContainer>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <LabelInputContainer>
              <Label htmlFor="phone" className="text-sm font-bold text-gray-700 mb-1">Phone Number</Label>
              <div className="relative">
                <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter your phone number"
                  required
                  className="pl-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
              </div>
            </LabelInputContainer>
          </div>
        </div>

        <div className="w-full h-px bg-gray-100 my-8"></div>

        {/* Section: Address Information */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconMapPin className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <h2 className="text-xl font-bold text-[#111827]">Address Information</h2>
            <div className="flex-1 h-px bg-gray-100 ml-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <LabelInputContainer>
              <Label htmlFor="address.city" className="text-sm font-bold text-gray-700 mb-1">City</Label>
              <div className="relative">
                <IconBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  type="text"
                  required
                  className="pl-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="address.state" className="text-sm font-bold text-gray-700 mb-1">State</Label>
              <div className="relative">
                <IconMap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  type="text"
                  required
                  className="pl-11 pr-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
                <IconChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </LabelInputContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LabelInputContainer>
              <Label htmlFor="address.country" className="text-sm font-bold text-gray-700 mb-1">Country</Label>
              <div className="relative">
                <IconWorld className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  placeholder="India"
                  type="text"
                  required
                  className="pl-11 pr-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
                <IconChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="address.pincode" className="text-sm font-bold text-gray-700 mb-1">Pincode</Label>
              <div className="relative">
                <IconPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
                <Input
                  id="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                  type="text"
                  maxLength={6}
                  required
                  className="pl-11 h-12 bg-white border border-gray-200 rounded-xl focus-visible:ring-[#1e9a58] text-base"
                />
              </div>
            </LabelInputContainer>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-[#f4fbf7] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-green-100 shadow-sm">
              <IconShieldCheck className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-bold text-[#1e9a58] text-xs mb-0.5">Secure & Safe</p>
              <p className="text-gray-500 text-[10px] leading-tight">Your data is protected and secure</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4 sm:border-l border-green-200/50 sm:pl-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-green-100 shadow-sm">
              <IconRosetteDiscountCheck className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-bold text-[#1e9a58] text-xs mb-0.5">Premium Quality</p>
              <p className="text-gray-500 text-[10px] leading-tight">We ensure top quality products</p>
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4 sm:border-l border-green-200/50 sm:pl-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-green-100 shadow-sm">
              <IconHeadset className="w-5 h-5 text-[#1e9a58]" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-bold text-[#1e9a58] text-xs mb-0.5">24/7 Support</p>
              <p className="text-gray-500 text-[10px] leading-tight">We're always here to help you</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          disabled={loading}
          className="w-full bg-[#1e9a58] hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(30,154,88,0.39)] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
        >
          {loading ? "Creating Account..." : "Create Account"} <IconArrowRight className="w-5 h-5" />
        </button>
        
        <p className="text-center text-xs text-gray-500 mt-4">
          By creating an account, you agree to our <a href="#" className="font-bold text-[#1e9a58] hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-[#1e9a58] hover:underline">Privacy Policy</a>.
        </p>
        
        <div className="w-full h-px bg-gray-100 my-6"></div>
        
        <p className="text-center text-sm font-medium text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            className="font-bold text-[#1e9a58] hover:underline ml-1"
            onClick={handleLogin}
          >
            Login
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

export default function RegisterPage() {
  return (
    <GuestRoute>
      <Signup />
    </GuestRoute>
  );
}
