import React from "react";
import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import "./ThemeToggle.css";

function ThemeToggle({ className = "", compact = false }) {
  const { isLight, theme, toggleTheme } = useTheme();
  const nextTheme = isLight ? "dark" : "light";

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {theme === "light" ? <SunMedium size={16} /> : <Moon size={16} />}
      </span>
      {!compact && <span className="theme-toggle-label">{theme === "light" ? "Light" : "Dark"}</span>}
    </button>
  );
}

export default ThemeToggle;
