import { CountryForm } from "@/components/forms/country-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountries } from "@/hooks/use-countries";
import { CountriesProvider } from "@/providers/countries.provider";
import { handleError } from "@/utils/toast.helpers";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ViewCountry() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedCountry, selectCountry } = useCountries();

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
          <CardTitle>Visualizar País</CardTitle>
        </CardHeader>
        <CardContent>
          <CountryForm
            onSubmit={() => {}}
            onBack={handleBack}
            isLoading={false}
            initialData={selectedCountry}
            disabled={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ViewCountryPageWrapper() {
  return (
    <CountriesProvider>
      <ViewCountry />
    </CountriesProvider>
  );
}
