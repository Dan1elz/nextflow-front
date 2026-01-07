import { useEffect, useState } from "react";
import NextflowLogoSvg from "@/assets/nextflow-logo.svg";
import NextflowLogo3Svg from "@/assets/nextflow-logo3.svg";
import { useTheme } from "@/hooks/use-theme";

interface NextflowLogoProps {
  className?: string;
}

export function NextflowLogo({ className }: NextflowLogoProps) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(() => {
    return window.document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const updateIsDark = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        setIsDark(systemTheme === "dark");
      } else {
        setIsDark(theme === "dark");
      }
    };

    updateIsDark();

    // Listener para mudanças no tema do sistema quando theme é "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      mediaQuery.addEventListener("change", handleChange);

      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const logoSrc = isDark ? NextflowLogo3Svg : NextflowLogoSvg;

  return <img src={logoSrc} alt="Nextflow" className={className} />;
}
