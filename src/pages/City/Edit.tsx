import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CityForm } from "@/components/forms/city-form";
import { useCities } from "@/hooks/use-cities";
import { useStates } from "@/hooks/use-states";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { CitiesProvider } from "@/providers/cities.provider";
import type { CitySchema } from "@/schemas/city.schema";
import type { ICity } from "@/interfaces/locations.interface";
import type { IState } from "@/interfaces/locations.interface";
import { StatesProvider } from "@/providers/states.provider";

function EditCity() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedCity, selectCity, updateCity } = useCities();
  const { searchStatesForOptions, getStateById } = useStates();
  const [isLoading, setIsLoading] = useState(false);

  const { options: statesOptions, handleSearch: handleSearchStates } =
    useSearchOptions<IState>({
      searchFn: searchStatesForOptions,
      mapFn: (state) => ({
        value: state.id ?? "",
        label: state.name,
      }),
      selectFn: getStateById,
      errorLabel: "estados",
      autoLoad: true,
      perPage: 50,
    });

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
            onSearch={async (query: string) => {
              await handleSearchStates(query, selectedCity?.stateId);
            }}
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
