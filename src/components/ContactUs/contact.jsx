"use client";
import React, { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  IconUser, 
  IconMail, 
  IconPhone, 
  IconTag, 
  IconSend, 
  IconLock 
} from "@tabler/icons-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactForm(data) {
  const name = (data.name || "").trim();
  if (name.length < 2) {
    return "Please enter your name (at least 2 characters).";
  }
  const email = (data.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return "Please enter a valid email address.";
  }
  const phone = (data.phone || "").trim();
  if (phone && !/^[\d\s+().-]{7,40}$/.test(phone)) {
    return "Please enter a valid phone number or leave it blank.";
  }
  const subject = (data.subject || "").trim();
  if (subject.length < 2) {
    return "Please enter a subject.";
  }
  const message = (data.message || "").trim();
  if (message.length < 10) {
    return "Please enter a message (at least 10 characters).";
  }
  return null;
}

const ContactForm = ({
  title = "Send us a message",
  subtitle = "Fill out the form below and we'll get back to you as soon as possible.",
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const clientErr = validateContactForm(formData);
      if (clientErr) {
        toast.error(clientErr);
        return;
      }

      if (!isAuthenticated) {
        sessionStorage.setItem("pendingContactMessage", JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: (formData.phone || "").trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }));
        toast.error("Please login to send a message.");
        router.push("/auth/login");
        return;
      }

      setIsSubmitting(true);

      try {
        if (onSubmit) {
          await onSubmit(formData);
          setFormData({
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
          });
        } else {
          const payload = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: (formData.phone || "").trim(),
            subject: formData.subject.trim(),
            message: formData.message.trim(),
          };
          const { data } = await axios.post("/api/contact", payload, {
            _skipGlobalToast: true,
          });
          if (data?.success) {
            toast.success(
              data.message ||
                "Thanks! We received your message and will get back to you soon."
            );
            setFormData({
              name: "",
              email: "",
              phone: "",
              subject: "",
              message: "",
            });
          } else {
            toast.error(data?.message || "Could not send your message.");
          }
        }
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          "Failed to send message. Please try again.";
        toast.error(msg);
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit]
  );

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 min-h-full">
      <h2 className="text-xl font-bold text-[#111827]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500 mb-8">
        {subtitle}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Name</label>
            <div className="relative">
              <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full pl-11 pr-4 h-11 bg-white border border-gray-200 rounded-xl text-sm outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Email Address</label>
            <div className="relative">
              <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 h-11 bg-white border border-gray-200 rounded-xl text-sm outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Phone (optional)</label>
            <div className="relative">
              <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full pl-11 pr-4 h-11 bg-white border border-gray-200 rounded-xl text-sm outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-bold text-gray-700">Subject</label>
            <div className="relative">
              <IconTag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1e9a58]" />
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Product inquiry, Order support..."
                className="w-full pl-11 pr-4 h-11 bg-white border border-gray-200 rounded-xl text-sm outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58]"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-sm font-bold text-gray-700">Your Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={5}
            placeholder="Tell us about your fashion needs, product questions, or how we can help you find your perfect style..."
            className="w-full p-4 bg-white border border-gray-200 rounded-xl text-sm outline-none text-neutral-800 transition duration-300 focus:ring-1 focus:ring-[#1e9a58] focus:border-[#1e9a58] resize-y"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex flex-col items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[200px] bg-[#1e9a58] hover:bg-green-700 text-white font-bold py-2.5 sm:py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm sm:text-base"
          >
            <IconSend className="w-4 h-4 sm:w-5 sm:h-5" />
            {isSubmitting ? "Sending..." : "Send message to support"}
          </button>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-[#1e9a58] font-semibold">
            <IconLock className="w-3.5 h-3.5" /> We typically reply within a few hours
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
