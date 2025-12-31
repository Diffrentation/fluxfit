"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      // Default to light mode (ignore system preference)
      setTheme("light");
      document.documentElement.classList.remove("dark");
      // Ensure localStorage is set to light if not already set
      if (!savedTheme || savedTheme !== "light") {
        localStorage.setItem("theme", "light");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const setLightTheme = () => {
    setTheme("light");
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
  };

  const setDarkTheme = () => {
    setTheme("dark");
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
  };

  const value = {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
