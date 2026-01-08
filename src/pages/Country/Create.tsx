import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryForm } from "@/components/forms/country-form";
import { useCountries } from "@/hooks/use-countries";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { ICountry } from "@/interfaces/locations.interface";
import { CountriesProvider } from "@/providers/countries.provider";
import type { CountrySchema } from "@/schemas/country.schema";

function CreateCountry() {
  const navigate = useNavigate();
  const { createCountry } = useCountries();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/countries");
  };

  const handleSubmit = async (data: CountrySchema) => {
    try {
      setIsLoading(true);
      const countryData: ICountry = {
        name: data.name,
        acronymIso: data.acronymIso,
        bacenCode: data.bacenCode,
      };

      await createCountry(countryData);
      handleSuccess("País criado com sucesso");
      navigate("/countries");
    } catch (error) {
      handleError(error, "Erro ao criar país");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar País</CardTitle>
        </CardHeader>
        <CardContent>
          <CountryForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            isEdit={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateCountryPageWrapper() {
  return (
    <CountriesProvider>
      <CreateCountry />
    </CountriesProvider>
  );
}
