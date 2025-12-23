import { ThemeContext } from "@/contexts/theme.context";
import type { TTheme, TThemeContext } from "@/types/theme";
import { useEffect, useState } from "react";

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "app-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: TTheme;
  storageKey?: string;
}) {
  const [theme, setTheme] = useState<TTheme>(
    () => (localStorage.getItem(storageKey) as TTheme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark", "system");

    root.classList.add(theme);
  }, [theme, storageKey]);

  const handleSetTheme = (newTheme: TTheme) => {
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
  };

  const value: TThemeContext = {
    theme,
    setTheme: handleSetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
