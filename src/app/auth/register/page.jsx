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
      addressLine1: "",
      landmark: "",
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
    
        data.append("address.addressLine1", formData.address.addressLine1);
        data.append("address.landmark", formData.address.landmark);
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
      !formData.address.addressLine1 ||
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

        {/* Section: Address Information */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#f4fbf7] flex items-center justify-center shrink-0">
              <IconMapPin className="w-[20px] h-[20px] text-[#1e9a58]" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111827]">Address Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <LabelInputContainer className="col-span-1 md:col-span-2">
              <Label htmlFor="address.addressLine1" className="text-sm font-semibold text-gray-700 mb-1.5">Address / Street</Label>
              <div className="relative group">
                <IconMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="address.addressLine1"
                  value={formData.address.addressLine1}
                  onChange={handleChange}
                  placeholder="123 Main St, Apartment 4B"
                  type="text"
                  required
                  className="pl-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="address.landmark" className="text-sm font-semibold text-gray-700 mb-1.5">Landmark (Optional)</Label>
              <div className="relative group">
                <IconMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="address.landmark"
                  value={formData.address.landmark}
                  onChange={handleChange}
                  placeholder="Near Central Park"
                  type="text"
                  className="pl-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="address.city" className="text-sm font-semibold text-gray-700 mb-1.5">City</Label>
              <div className="relative group">
                <IconBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  type="text"
                  required
                  className="pl-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="address.state" className="text-sm font-semibold text-gray-700 mb-1.5">State</Label>
              <div className="relative group">
                <IconMap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  type="text"
                  required
                  className="pl-10 pr-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
                <IconChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="address.country" className="text-sm font-semibold text-gray-700 mb-1.5">Country</Label>
              <div className="relative group">
                <IconWorld className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  placeholder="India"
                  type="text"
                  required
                  className="pl-10 pr-10 h-12 bg-[#f8fafe] border border-transparent focus:bg-white focus:border-[#1e9a58] rounded-xl focus-visible:ring-4 focus-visible:ring-[#1e9a58]/10 text-[15px] transition-all"
                />
                <IconChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
              </div>
            </LabelInputContainer>

            <LabelInputContainer className="col-span-1 md:col-span-2">
              <Label htmlFor="address.pincode" className="text-sm font-semibold text-gray-700 mb-1.5">Pincode</Label>
              <div className="relative group">
                <IconPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#1e9a58] transition-colors" />
                <Input
                  id="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                  type="text"
                  maxLength={6}
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
