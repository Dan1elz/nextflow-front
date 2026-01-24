import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CityForm } from "@/components/forms/city-form";
import { useCities } from "@/hooks/use-cities";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { CitiesProvider } from "@/providers/cities.provider";
import type { CitySchema } from "@/schemas/city.schema";
import type { ICity } from "@/interfaces/locations.interface";
import type { IOption } from "@/interfaces/api.interface";
import { useStates } from "@/hooks/use-states";
import { StatesProvider } from "@/providers/states.provider";

//ta tudo errado
function EditCity() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { searchStates, states } = useStates();
  const { selectedCity, selectCity, updateCity } = useCities();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (data: CitySchema) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const cityData: ICity = {
        name: data.name,
        ibgeCode: data.ibgeCode,
        stateId: data.stateId,
        state: null,
      };

      await updateCity(id, cityData);
      handleSuccess("Cidade atualizada com sucesso");
      navigate("/cities");
    } catch (error) {
      handleError(error, "Erro ao atualizar cidade");
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle>Editar País</CardTitle>
        </CardHeader>
        <CardContent>
          <CityForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            initialData={selectedCity}
            isEdit={false}
            data={statesOptions}
            onSearch={handleSearchStates}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditCityPageWrapper() {
  return (
    <CitiesProvider>
      <StatesProvider>
        <EditCity />
      </StatesProvider>
    </CitiesProvider>
  );
}
