"use client";
import React, { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

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
  title = "Get in Touch With Us",
  subtitle = "Have questions about our products, orders, or fashion trends? Send us a message and our team will connect with you shortly. We're here to help you find your perfect style!",
  onSubmit,
  className = " text-sm",
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div
      className={cn(
        "w-full mt-12 sm:mt-16 md:mt-20 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12",
        className
      )}
    >
      <div className="shadow-input w-full rounded-none bg-white p-4 sm:p-6 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
          {subtitle}
        </p>
        <form className="my-8" onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                type="text"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </LabelInputContainer>
          </div>
          <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <LabelInputContainer>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+91 9876543210"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Product inquiry, Order support..."
                type="text"
                value={formData.subject}
                onChange={handleChange}
              />
            </LabelInputContainer>
          </div>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your fashion needs, product questions, or how we can help you find your perfect style..."
              rows={6}
              value={formData.message}
              onChange={handleChange}
            />
          </LabelInputContainer>

          <div className="flex justify-center">
            <button
              className="group/btn relative inline-flex h-10 min-h-10 min-w-[350px] items-center justify-center rounded-md bg-gradient-to-br from-black to-neutral-600 px-10 text-sm font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Sending your message…"
                : "Send message to support"}
              <BottomGradient />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

// Textarea component with Aceternity UI styling
const Textarea = React.forwardRef(({ className, rows = 4, ...props }, ref) => {
  const radius = 100;
  const [visible, setVisible] = React.useState(false);
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      style={{
        background: useMotionTemplate`
            radial-gradient(
              ${
                visible ? radius + "px" : "0px"
              } circle at ${mouseX}px ${mouseY}px,
              #3b82f6,
              transparent 80%
            )
          `,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input rounded-lg p-[2px] transition duration-300"
    >
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          `shadow-input dark:placeholder-text-neutral-600 flex w-full rounded-md border-none bg-gray-50 px-3 py-2 text-sm text-black transition duration-400 group-hover/input:shadow-none placeholder:text-neutral-400 focus-visible:ring-[2px] focus-visible:ring-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-neutral-600 resize-y`,
          className
        )}
        {...props}
      />
    </motion.div>
  );
});
Textarea.displayName = "Textarea";

export default ContactForm;
