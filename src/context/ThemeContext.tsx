"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
  document.documentElement.classList.add("dark");
  document.documentElement.style.setProperty(
    "--custom-dark-bg",
    "rgb(20 20 20 / var(--tw-bg-opacity,1))"
  );
  setIsInitialized(true);
}, []);

  // useEffect(() => {
  //   if (isInitialized) {
  //     localStorage.setItem("theme", theme);

  //     if (theme === "dark") {
  //       document.documentElement.classList.add("dark");
  //       document.documentElement.style.setProperty(
  //         "--custom-dark-bg",
  //         "rgb(20 20 20 / var(--tw-bg-opacity,1))"
  //       );
  //     } else {
  //       document.documentElement.classList.remove("dark");
  //       document.documentElement.style.removeProperty("--custom-dark-bg");
  //     }
  //   }
  // }, [theme, isInitialized]);

  const toggleTheme = () => {
    // setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
