"use client";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AdminContent({ children, className }) {
  const { isCollapsed } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{
        marginLeft: isDesktop ? (isCollapsed ? 80 : 256) : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className={cn(
        "flex-1 min-w-0 mt-16",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

