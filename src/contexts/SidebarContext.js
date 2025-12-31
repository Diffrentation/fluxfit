"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage on mount to prevent hydration mismatch
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminSidebarCollapsed");
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Save collapsed state to localStorage (only when it changes, not on initial mount)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminSidebarCollapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

