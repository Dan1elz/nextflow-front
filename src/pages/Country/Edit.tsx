import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryForm } from "@/components/forms/country-form";
import { useCountries } from "@/hooks/use-countries";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { CountriesProvider } from "@/providers/countries.provider";
import type { CountrySchema } from "@/schemas/country.schema";
import type { ICountry } from "@/interfaces/locations.interface";

function EditCountry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedCountry, selectCountry, updateCountry } = useCountries();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/countries");
  };

  useEffect(() => {
    if (!id) {
      navigate("/countries");
      return;
    }

    selectCountry(id).catch((error) => {
      handleError(error, "Erro desconhecido ao buscar país");
      navigate("/countries");
    });
  }, [id, navigate, selectCountry]);

  const handleSubmit = async (data: CountrySchema) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const countryData: ICountry = {
        id: id,
        name: data.name,
        acronymIso: data.acronymIso,
        bacenCode: data.bacenCode,
      };

      await updateCountry(id, countryData);
      handleSuccess("País atualizado com sucesso");
      navigate("/countries");
    } catch (error) {
      handleError(error, "Erro ao atualizar país");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedCountry) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Carregando...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar País</CardTitle>
        </CardHeader>
        <CardContent>
          <CountryForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            initialData={selectedCountry}
            isEdit={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditCountryPageWrapper() {
  return (
    <CountriesProvider>
      <EditCountry />
    </CountriesProvider>
  );
}
