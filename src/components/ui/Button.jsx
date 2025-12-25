"use client";
import React from "react";
import { motion } from "framer-motion";

const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 hover:shadow-md focus:ring-gray-500",
    danger:
      "bg-red-500 text-white hover:bg-red-600 hover:shadow-md focus:ring-red-500",
    success:
      "bg-green-500 text-white hover:bg-green-600 hover:shadow-md focus:ring-green-500",
    outline:
      "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm hover:border-gray-400 focus:ring-gray-500",
    ghost:
      "text-gray-700 hover:bg-gray-100 hover:shadow-sm focus:ring-gray-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
