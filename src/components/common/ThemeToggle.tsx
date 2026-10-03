"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "../providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        theme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        border
        border-gray-500
        bg-white
        text-gray-700
        shadow-md
        transition-all
        duration-200
        hover:scale-105
        hover:bg-gray-500
        active:scale-95

        dark:border-slate-700
        dark:bg-slate-800
        dark:text-gray-100
      "
    >
      {theme === "dark" ? (
        <Sun size={19} />
      ) : (
        <Moon size={19} />
      )}
    </button>
  );
}