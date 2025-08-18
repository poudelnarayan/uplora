"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import styles from "./ThemeToggle.module.css";

// Create theme context
import { createContext, useContext } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback for when context is not available
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      const savedTheme = localStorage.getItem("uplora-theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }, []);

    const toggleTheme = () => {
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
      localStorage.setItem("uplora-theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    };

    return { theme, toggleTheme, mounted };
  }
  return context;
}

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={styles.button}>
        <div className="w-5 h-5" />
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={styles.button}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait">
        {theme === "dark" ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-amber-600" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-slate-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Export the context for use in providers
export { ThemeContext };