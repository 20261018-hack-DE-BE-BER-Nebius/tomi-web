"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries, languages } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const AppContext = createContext({
  language: "en" as Language,
  setLanguage: (_: Language) => {},
  theme: "dark",
  toggleTheme: () => {},
  t: dictionaries.en,
});
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const saved = localStorage.getItem("tomi-language");
    if (languages.includes(saved as Language)) setLanguage(saved as Language);
    const color = localStorage.getItem("tomi-theme");
    setTheme(
      color === "light" || color === "dark"
        ? color
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
    );
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => console.warn("Offline support could not be registered"));
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("tomi-language", language);
    localStorage.setItem("tomi-theme", theme);
  }, [language, theme]);
  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
        t: dictionaries[language],
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  return useContext(AppContext);
}
