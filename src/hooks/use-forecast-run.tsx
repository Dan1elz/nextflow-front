import { useContext } from "react";

import { ForecastRunContext } from "@/contexts/forecast-run.context";

export function useForecastRun() {
  const context = useContext(ForecastRunContext);

  if (!context) {
    throw new Error("useForecastRun must be used within a ForecastRunProvider");
  }

  return context;
}
