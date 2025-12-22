import type { TThemeContext } from "@/types/theme";
import { createContext } from "react";

const initialTheme: TThemeContext = {
  theme: "light",
  setTheme: () => null,
};

export const ThemeContext = createContext<TThemeContext>(initialTheme);
