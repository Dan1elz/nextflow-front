import { useContext } from "react";
import { CountriesContext } from "@/contexts/countries.context";

export function useCountries() {
  const context = useContext(CountriesContext);

  if (!context) {
    throw new Error("useCountries must be used within a CountriesProvider");
  }

  return context;
}
