import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CityForm } from "@/components/forms/city-form";
import { useCities } from "@/hooks/use-cities";
import { useStates } from "@/hooks/use-states";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { ICity } from "@/interfaces/locations.interface";
import { CitiesProvider } from "@/providers/cities.provider";
import type { CitySchema } from "@/schemas/city.schema";
import type { IState } from "@/interfaces/locations.interface";
import { StatesProvider } from "@/providers/states.provider";

function CreateCity() {
  const navigate = useNavigate();
  const { createCity } = useCities();
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
      autoLoad: false,
      perPage: 50,
    });

  const handleBack = () => {
    navigate("/cities");
  };

  const handleSubmit = async (data: CitySchema) => {
    try {
      setIsLoading(true);
      const cityData: ICity = {
        name: data.name,
        ibgeCode: data.ibgeCode,
        stateId: data.stateId,
        state: null,
      };

      await createCity(cityData);
      handleSuccess("Cidade criada com sucesso");
      navigate("/cities");
    } catch (error) {
      handleError(error, "Erro ao criar cidade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Cidade</CardTitle>
        </CardHeader>
        <CardContent>
          <CityForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            isEdit={false}
            data={statesOptions}
            onSearch={handleSearchStates}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateCityPageWrapper() {
  return (
    <CitiesProvider>
      <StatesProvider>
        <CreateCity />
      </StatesProvider>
    </CitiesProvider>
  );
}
