import { CityForm } from "@/components/forms/city-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCities } from "@/hooks/use-cities";
import { useStates } from "@/hooks/use-states";
import type { IOption } from "@/interfaces/api.interface";
import { CitiesProvider } from "@/providers/cities.provider";
import { StatesProvider } from "@/providers/states.provider";
import { handleError } from "@/utils/toast.helpers";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ViewCity() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { searchStates, states } = useStates();
  const { selectedCity, selectCity } = useCities();

  const statesOptions: IOption[] = useMemo(() => {
    return states.map((state) => ({
      value: state.id ?? "",
      label: state.name,
    }));
  }, [states]);

  const handleBack = () => {
    navigate("/cities");
  };

  useEffect(() => {
    if (!id) {
      navigate("/cities");
      return;
    }

    selectCity(id).catch((error) => {
      handleError(error, "Erro desconhecido ao buscar cidade");
      navigate("/cities");
    });
  }, [id, navigate, selectCity]);

  const handleSearchStates = useCallback(
    async (query: string) => {
      const filters: Record<string, string> = {
        search: query,
      };

      await searchStates({
        filters,
        page: 1,
        perPage: 50,
      });
    },
    [searchStates]
  );

  if (!selectedCity) {
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
          <CityForm
            onSubmit={() => {}}
            onBack={handleBack}
            isLoading={false}
            initialData={selectedCity}
            disabled={true}
            data={statesOptions}
            onSearch={handleSearchStates}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ViewCityPageWrapper() {
  return (
    <CitiesProvider>
      <StatesProvider>
        <ViewCity />
      </StatesProvider>
    </CitiesProvider>
  );
}
