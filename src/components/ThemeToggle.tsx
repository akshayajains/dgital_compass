import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 active:scale-95 transition-all border border-white/10 flex items-center gap-1.5"
      title={theme === "light" ? (language === 'hi' ? "डार्क मोड" : "Dark Mode") : (language === 'hi' ? "लाइट मोड" : "Light Mode")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-amber-400" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400" />
      )}
    </button>
  );
}
