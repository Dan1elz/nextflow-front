import { useCallback, useMemo } from "react";
import { StateForm } from "@/components/forms/state-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStates } from "@/hooks/use-states";
import { useCountries } from "@/hooks/use-countries";
import { StatesProvider } from "@/providers/states.provider";
import { CountriesProvider } from "@/providers/countries.provider";
import { handleError } from "@/utils/toast.helpers";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { IOption } from "@/interfaces/api.interface";

function ViewState() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedState, selectState } = useStates();
  const { searchCountries, countries } = useCountries();

  const countriesOptions: IOption[] = useMemo(() => {
    return countries.map((country) => ({
      value: country.id ?? "",
      label: country.name,
    }));
  }, [countries]);

  const handleBack = () => {
    navigate("/states");
  };

  useEffect(() => {
    if (!id) {
      navigate("/states");
      return;
    }

    selectState(id).catch((error) => {
      handleError(error, "Erro desconhecido ao buscar estado");
      navigate("/states");
    });
  }, [id, navigate, selectState]);

  const handleSearchCountries = useCallback(
    async (query: string) => {
      const filters: Record<string, string> = {
        search: query,
      };

      await searchCountries({
        filters,
        page: 1,
        perPage: 50,
      });
    },
    [searchCountries]
  );

  if (!selectedState) {
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
          <CardTitle>Visualizar Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <StateForm
            onSubmit={() => {}}
            onBack={handleBack}
            isLoading={false}
            initialData={selectedState}
            disabled={true}
            data={countriesOptions}
            onSearch={handleSearchCountries}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ViewStatePageWrapper() {
  return (
    <StatesProvider>
      <CountriesProvider>
        <ViewState />
      </CountriesProvider>
    </StatesProvider>
  );
}
