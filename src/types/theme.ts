export type TTheme = "dark" | "light" | "system";

export type TThemeContext = {
  theme: TTheme;
  setTheme: (theme: TTheme) => void;
};
