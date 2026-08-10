"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import {
  IconCamera,
  IconHome,
  IconMail,
  IconMapPin,
  IconPhone,
  IconShield,
  IconTrash,
  IconUser,
  IconShieldCheck,
  IconRosetteDiscountCheck,
  IconBuilding,
  IconWorld,
  IconPin,
  IconLock,
  IconTruck,
  IconRefresh,
  IconHeadset,
  IconEdit,
  IconStar,
  IconX,
  IconLoader,
  IconMap,
  IconArrowRight,
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconKey,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import toast from "react-hot-toast";

const jsonHeaders = () => ({
  "Content-Type": "application/json",
});

function mapServerUser(u) {
  if (!u) return null;
  const id = u.id != null ? String(u.id) : u._id != null ? String(u._id) : "";
  return { ...u, _id: id, id };
}

const CustomSelect = ({ name, value, onChange, options, icon: Icon, placeholder = "Select option", small = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={containerRef}>
      {Icon && <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1e9a58] ${small ? "w-4 h-4" : "w-[18px] h-[18px]"}`} />}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left ${Icon ? "pl-11" : "pl-4"} pr-4 ${small ? "h-[44px] text-sm rounded-xl" : "h-[48px] text-[15px] rounded-xl"} bg-white border outline-none transition duration-300 ${
          isOpen ? "border-[#1e9a58] ring-1 ring-[#1e9a58]" : "border-gray-200"
        } text-neutral-800 flex justify-between items-center`}
      >
        <span className="truncate">{value ? selectedLabel : placeholder}</span>
        <IconChevronDown className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""} ${small ? "w-4 h-4" : "w-5 h-5"}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-4 py-3 ${small ? "text-sm" : "text-[15px]"} transition-colors ${
                value === option.value
                  ? "bg-[#1e9a58] text-white"
                  : "text-gray-700 hover:bg-[#eaf5ef] hover:text-[#1e9a58]"
              }`}
              onClick={() => {
                onChange({ target: { name, value: option.value } });
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

function ProfileContent() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account"); // 'account' | 'addresses'

  // Data states
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const fileInputRef = useRef(null);

  // Form states (React controlled)
  const [accountForm, setAccountForm] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    type: "home",
    landmark: "",
    isDefault: false,
  });

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/users/profile", {
        _skipGlobalToast: true,
      });
      if (data?.success && data.data?.user) {
        const mapped = mapServerUser(data.data.user);
        setUser((prev) => ({ ...prev, ...mapped }));
        setAccountForm({
          firstname: mapped.firstname || "",
          lastname: mapped.lastname || "",
          phone: mapped.phone || "",
          city: mapped.address?.city || "",
          state: mapped.address?.state || "",
          country: mapped.address?.country || "India",
          pincode: mapped.address?.pincode || "",
        });
      }
    } catch {
      // keep cached
    } finally {
      setProfileLoading(false);
    }
  }, [setUser]);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    try {
      const { data } = await axios.get("/api/users/addresses", {
        _skipGlobalToast: true,
      });
      if (data?.success && data.data?.addresses) {
        setAddresses(
          data.data.addresses.map((a) => ({ ...a, id: String(a.id) }))
        );
      } else {
        setAddresses([]);
      }
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if (!user || profileLoading) return;
    setAccountForm({
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      phone: user.phone || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      country: user.address?.country || "India",
      pincode: user.address?.pincode || "",
    });
  }, [user, profileLoading]);

  const displayName = [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim();

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const { data } = await axios.put(
        "/api/users/profile",
        {
          firstname: accountForm.firstname,
          lastname: accountForm.lastname,
          phone: accountForm.phone || null,
          address: {
            city: accountForm.city || null,
            state: accountForm.state || null,
            country: accountForm.country || "India",
            pincode: accountForm.pincode || null,
          },
        },
        { headers: jsonHeaders(), _skipGlobalToast: true }
      );
      if (data?.success && data.data?.user) {
        const mapped = mapServerUser(data.data.user);
        setUser((prev) => ({ ...prev, ...mapped }));
        toast.success("Profile saved successfully");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not save profile");
    } finally {
      setSavingAccount(false);
    }
  };

  const handlePasswordFieldChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }
    setChangingPassword(true);
    try {
      const { data } = await axios.put(
        "/api/users/password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: jsonHeaders(), _skipGlobalToast: true }
      );
      if (data?.success) {
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const onPickPhoto = () => fileInputRef.current?.click();

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "fluxfit/profiles");
      const up = await axios.post("/api/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        _skipGlobalToast: true,
      });
      const url = up.data?.data?.url;
      if (!url) throw new Error("No image URL");
      
      const { data } = await axios.put(
        "/api/users/profile",
        { profileimage: url },
        { headers: jsonHeaders(), _skipGlobalToast: true }
      );
      if (data?.success && data.data?.user) {
        const mapped = mapServerUser(data.data.user);
        setUser((prev) => ({ ...prev, ...mapped }));
        toast.success("Profile photo updated");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      name: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      type: "home",
      landmark: "",
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      country: addr.country || "India",
      pincode: addr.pincode,
      type: addr.type || "home",
      landmark: addr.landmark || "",
      isDefault: addr.isDefault,
    });
    setAddressModalOpen(true);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const payload = { ...addressForm };
      if (editingAddress) {
        await axios.put(`/api/users/addresses/${editingAddress.id}`, payload, {
          headers: jsonHeaders(),
          _skipGlobalToast: true,
        });
        toast.success("Address updated");
      } else {
        await axios.post("/api/users/addresses", payload, {
          headers: jsonHeaders(),
          _skipGlobalToast: true,
        });
        toast.success("Address added");
      }
      setAddressModalOpen(false);
      await loadAddresses();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      await axios.put(`/api/users/addresses/${id}/default`, {}, {
        headers: jsonHeaders(),
        _skipGlobalToast: true,
      });
      toast.success("Default address updated");
      await loadAddresses();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not set default");
    }
  };

  const deleteAddress = async (addr) => {
    if (window.confirm("Remove this address?")) {
      try {
        await axios.delete(`/api/users/addresses/${addr.id}`, {
          headers: jsonHeaders(),
          _skipGlobalToast: true,
        });
        toast.success("Address removed");
        await loadAddresses();
      } catch (e) {
        toast.error(e?.response?.data?.message || "Could not delete address");
      }
    }
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-[#fafcfb] pb-20">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-20 sm:pt-28 pb-8 lg:pb-12">
        
        {/* Header */}
        <div className="mb-6 lg:mb-8 text-center lg:text-left">
          <h1 className="text-3xl lg:text-5xl font-bold text-[#111827] tracking-tight mb-2 line-clamp-2">
            Profile, <span className="text-[#1e9a58]">Your Journey</span>
          </h1>
          <p className="text-gray-500 text-[15px] lg:text-lg">
            Keep your details up to date and enjoy a smoother experience.
          </p>
        </div>

        {/* Tabs - Segmented Control */}
        <div className="bg-gray-100/80 p-1.5 rounded-[16px] flex grid grid-cols-2 gap-1 mb-8">
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-all duration-300 ${
              activeTab === "account"
                ? "bg-white text-[#1e9a58] shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <IconUser className="w-[18px] h-[18px]" /> Account
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] transition-all duration-300 ${
              activeTab === "addresses"
                ? "bg-white text-[#1e9a58] shadow-sm ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <IconMapPin className="w-[18px] h-[18px]" /> Saved Addresses
          </button>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Sidebar: Profile Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
              
              {/* Avatar */}
              <div className="relative mb-4 group">
                <div className="w-[96px] h-[96px] rounded-full border-[3px] border-[#eaf5ef] overflow-hidden flex items-center justify-center bg-gray-50">
                  {uploadingPhoto ? (
                    <IconLoader className="w-8 h-8 text-[#1e9a58] animate-spin" />
                  ) : user?.profileimage ? (
                    <img src={user.profileimage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <IconUser className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={onPickPhoto}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 bg-[#1e9a58] text-white p-2 rounded-full border-[3px] border-white shadow-sm hover:bg-green-700 transition"
                  title="Update Photo"
                >
                  <IconCamera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoChange}
                />
              </div>

              {/* Name & Badges */}
              <h2 className="text-xl font-bold text-[#111827] mb-2 text-center line-clamp-1">
                {displayName || user?.username || "Member"}
              </h2>
              <div className="flex flex-wrap justify-center items-center gap-2 mb-6">
                <span className="px-3 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
                  Buyer
                </span>
                {user?.isverified ? (
                  <span className="px-3 py-1 flex items-center gap-1 text-[11px] font-bold text-[#1e9a58] bg-[#eaf5ef] border border-[#1e9a58]/30 rounded-full">
                    <IconRosetteDiscountCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full">
                    Unverified
                  </span>
                )}
              </div>

              {/* Info Block (Icon + Text Row Grid) */}
              <div className="w-full flex flex-col gap-3 mb-5">
                <div className="flex items-center gap-3 text-[14px] text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <IconMail className="w-[18px] h-[18px] text-gray-400" />
                  </div>
                  <span className="truncate">{user?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-[14px] text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <IconUser className="w-[18px] h-[18px] text-gray-400" />
                  </div>
                  <span className="truncate">@{user?.username || "—"}</span>
                </div>
                {joinDate && (
                  <div className="flex items-center gap-3 text-[14px] text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <IconMapPin className="w-[18px] h-[18px] text-gray-400" />
                    </div>
                    <span className="font-medium">Member since {joinDate}</span>
                  </div>
                )}
              </div>

              {/* Security Block */}
              <div className="w-full bg-[#eaf5ef] border border-[#1e9a58]/20 rounded-xl p-4 flex gap-3 items-center">
                <IconShieldCheck className="w-6 h-6 shrink-0 text-[#1e9a58]" />
                <div>
                  <h4 className="text-[13px] font-bold text-[#1e9a58]">Your account is secure</h4>
                  <p className="text-[11px] text-[#1e9a58]/80 mt-0.5 leading-snug">
                    We never share your personal info.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content: Forms & Addresses */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Account Form */}
            {activeTab === "account" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
                <form onSubmit={onSaveAccount} className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                      <IconUser className="w-5 h-5 text-[#1e9a58]" /> Personal Details
                    </h3>
                    <Link href="/orders" className="text-[13px] font-semibold text-gray-600 hover:text-[#1e9a58] flex items-center gap-1 border border-gray-200 px-3 py-1.5 rounded-lg transition">
                      Orders <IconArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-8">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <div className="relative">
                        <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type="text"
                          name="firstname"
                          value={accountForm.firstname}
                          onChange={handleAccountChange}
                          required
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <div className="relative">
                        <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type="text"
                          name="lastname"
                          value={accountForm.lastname}
                          onChange={handleAccountChange}
                          required
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <div className="relative">
                        <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type="text"
                          name="phone"
                          value={accountForm.phone}
                          onChange={handleAccountChange}
                          placeholder="+91 ..."
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-100 mb-8"></div>

                  <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2 mb-6">
                    <IconMapPin className="w-5 h-5 text-[#1e9a58]" /> Location Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:mb-12">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">City</label>
                      <div className="relative">
                        <IconBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type="text"
                          name="city"
                          value={accountForm.city}
                          onChange={handleAccountChange}
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">State</label>
                      <CustomSelect
                        name="state"
                        value={accountForm.state}
                        onChange={handleAccountChange}
                        icon={IconMap}
                        placeholder="Select State"
                        options={[
                          { value: "Uttar Pradesh", label: "Uttar Pradesh" },
                          { value: "Maharashtra", label: "Maharashtra" },
                          { value: "Delhi", label: "Delhi" },
                          { value: "Karnataka", label: "Karnataka" },
                        ]}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Country</label>
                      <CustomSelect
                        name="country"
                        value={accountForm.country}
                        onChange={handleAccountChange}
                        icon={IconWorld}
                        placeholder="Select Country"
                        options={[
                          { value: "India", label: "India" },
                        ]}
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Pincode</label>
                      <div className="relative">
                        <IconPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type="text"
                          name="pincode"
                          value={accountForm.pincode}
                          onChange={handleAccountChange}
                          maxLength={10}
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={savingAccount}
                      className="w-full sm:w-auto h-[48px] bg-[#1e9a58] hover:bg-green-700 text-white font-bold px-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-[15px] shadow-md shadow-green-500/20"
                    >
                      {savingAccount ? "Saving..." : "Save Changes"}
                    </button>
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[13px] text-gray-500">
                      <IconLock className="w-4 h-4" /> Changes are secure and encrypted
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Change Password */}
            {activeTab === "account" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <form onSubmit={onChangePassword}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                      <IconKey className="w-5 h-5 text-[#1e9a58]" /> Change Password
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowPasswords((v) => !v)}
                      className="text-[13px] font-semibold text-gray-500 hover:text-[#1e9a58] flex items-center gap-1.5"
                    >
                      {showPasswords ? (
                        <IconEyeOff className="w-4 h-4" />
                      ) : (
                        <IconEye className="w-4 h-4" />
                      )}
                      {showPasswords ? "Hide" : "Show"} passwords
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6">
                    <div className="flex flex-col space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Current Password</label>
                      <div className="relative">
                        <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type={showPasswords ? "text" : "password"}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordFieldChange}
                          required
                          autoComplete="current-password"
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">New Password</label>
                      <div className="relative">
                        <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type={showPasswords ? "text" : "password"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordFieldChange}
                          required
                          minLength={8}
                          maxLength={32}
                          autoComplete="new-password"
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                      <div className="relative">
                        <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1e9a58]" />
                        <input
                          type={showPasswords ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordFieldChange}
                          required
                          minLength={8}
                          maxLength={32}
                          autoComplete="new-password"
                          className="w-full pl-10 pr-4 h-[48px] bg-white border border-gray-200 rounded-xl text-[15px] outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full sm:w-auto h-[48px] bg-[#1e9a58] hover:bg-green-700 text-white font-bold px-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-[15px] shadow-md shadow-green-500/20"
                    >
                      {changingPassword ? "Updating..." : "Update Password"}
                    </button>
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[13px] text-gray-500">
                      <IconShieldCheck className="w-4 h-4" /> At least 8 characters
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                    <IconMapPin className="w-5 h-5 text-[#1e9a58]" /> Delivery Addresses
                  </h3>
                  <button onClick={openNewAddress} className="text-[13px] font-bold text-white bg-[#1e9a58] hover:bg-green-700 px-4 py-2 rounded-lg transition shadow-sm">
                    + Add New
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="flex justify-center py-10"><IconLoader className="w-8 h-8 text-[#1e9a58] animate-spin" /></div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                    <IconMapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-gray-700">No saved addresses</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Add your first address for faster checkout.</p>
                    <button onClick={openNewAddress} className="bg-[#1e9a58] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition">
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="border border-gray-200 rounded-2xl p-5 hover:border-[#1e9a58] transition group relative bg-white shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-[#111827] flex items-center gap-2">
                            {addr.type === "home" ? <IconHome className="w-[18px] h-[18px] text-[#1e9a58]" /> : <IconBuilding className="w-[18px] h-[18px] text-[#1e9a58]" />}
                            {addr.name}
                          </h4>
                          {addr.isDefault && (
                            <span className="bg-[#eaf5ef] text-[#1e9a58] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#1e9a58]/30">Default</span>
                          )}
                        </div>
                        <p className="text-[14px] text-gray-600 mb-1 leading-relaxed">
                          {addr.addressLine1} {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                        </p>
                        <p className="text-[14px] text-gray-600 mb-3">
                          {addr.city}, {addr.state} {addr.pincode}
                        </p>
                        <div className="text-[14px] text-gray-500 font-medium flex items-center gap-1.5 mb-4 bg-gray-50 p-2 rounded-lg w-fit">
                          <IconPhone className="w-4 h-4 text-gray-400" /> {addr.phone}
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                          {!addr.isDefault && (
                            <button onClick={() => setDefaultAddress(addr.id)} className="text-xs font-bold text-gray-500 hover:text-[#1e9a58] flex items-center gap-1">
                              <IconStar className="w-3.5 h-3.5" /> Set Default
                            </button>
                          )}
                          <button onClick={() => openEditAddress(addr)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-auto bg-blue-50 px-2 py-1 rounded-md">
                            <IconEdit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => deleteAddress(addr)} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md">
                            <IconTrash className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Feature Cards Bottom Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-8 lg:mt-12 mb-8">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#f4fbf7] flex items-center justify-center mb-3">
              <IconTruck className="w-5 h-5 lg:w-6 lg:h-6 text-[#1e9a58]" />
            </div>
            <h4 className="font-bold text-[#111827] text-[13px] lg:text-sm">Fast Delivery</h4>
            <p className="text-[11px] lg:text-xs text-gray-500 mt-1 line-clamp-2">On-time delivery at your doorstep</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#f4fbf7] flex items-center justify-center mb-3">
              <IconRefresh className="w-5 h-5 lg:w-6 lg:h-6 text-[#1e9a58]" />
            </div>
            <h4 className="font-bold text-[#111827] text-[13px] lg:text-sm">Easy Returns</h4>
            <p className="text-[11px] lg:text-xs text-gray-500 mt-1 line-clamp-2">Hassle-free returns within 7 days</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#f4fbf7] flex items-center justify-center mb-3">
              <IconShieldCheck className="w-5 h-5 lg:w-6 lg:h-6 text-[#1e9a58]" />
            </div>
            <h4 className="font-bold text-[#111827] text-[13px] lg:text-sm">100% Secure</h4>
            <p className="text-[11px] lg:text-xs text-gray-500 mt-1 line-clamp-2">Safe & encrypted transactions</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-[#f4fbf7] flex items-center justify-center mb-3">
              <IconHeadset className="w-5 h-5 lg:w-6 lg:h-6 text-[#1e9a58]" />
            </div>
            <h4 className="font-bold text-[#111827] text-[13px] lg:text-sm">24/7 Support</h4>
            <p className="text-[11px] lg:text-xs text-gray-500 mt-1 line-clamp-2">We&apos;re here to help anytime</p>
          </div>
        </div>

      </div>

      {/* Custom Address Modal */}
      <AnimatePresence>
        {addressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAddressModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-lg text-[#111827]">
                  {editingAddress ? "Edit Address" : "New Address"}
                </h3>
                <button onClick={() => setAddressModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-1 rounded-full shadow-sm transition">
                  <IconX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto custom-scrollbar">
                <form id="address-form" onSubmit={saveAddress} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-gray-700">Full Name</label>
                      <input type="text" name="name" required value={addressForm.name} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-gray-700">Phone</label>
                      <input type="text" name="phone" required value={addressForm.phone} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-gray-700">Address Line 1</label>
                      <input type="text" name="addressLine1" required value={addressForm.addressLine1} onChange={handleAddressChange} placeholder="Street, building, flat" className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-gray-700">Address Line 2 (Optional)</label>
                      <input type="text" name="addressLine2" value={addressForm.addressLine2} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">City</label>
                      <input type="text" name="city" required value={addressForm.city} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">State</label>
                      <input type="text" name="state" required value={addressForm.state} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Country</label>
                      <input type="text" name="country" value={addressForm.country} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Pincode</label>
                      <input type="text" name="pincode" required value={addressForm.pincode} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-gray-700">Type</label>
                      <CustomSelect
                        name="type"
                        value={addressForm.type}
                        onChange={handleAddressChange}
                        placeholder="Select Type"
                        small={true}
                        options={[
                          { value: "home", label: "Home" },
                          { value: "work", label: "Work" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-gray-700">Landmark</label>
                      <input type="text" name="landmark" value={addressForm.landmark} onChange={handleAddressChange} className="w-full px-3 h-[44px] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58]" />
                    </div>
                    <div className="col-span-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer w-max">
                        <input type="checkbox" name="isDefault" checked={addressForm.isDefault} onChange={handleAddressChange} className="w-4 h-4 text-[#1e9a58] rounded focus:ring-[#1e9a58] border-gray-300" />
                        <span className="text-sm font-medium text-gray-700">Set as default delivery address</span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button type="button" onClick={() => setAddressModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition text-[14px]">
                  Cancel
                </button>
                <button type="submit" form="address-form" disabled={savingAddress} className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#1e9a58] hover:bg-green-700 transition disabled:opacity-50 text-[14px] shadow-sm shadow-green-500/20">
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
