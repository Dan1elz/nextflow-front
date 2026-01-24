import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CityForm } from "@/components/forms/city-form";
import { useCities } from "@/hooks/use-cities";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { ICity } from "@/interfaces/locations.interface";
import { CitiesProvider } from "@/providers/cities.provider";
import type { CitySchema } from "@/schemas/city.schema";
import { useStates } from "@/hooks/use-states";
import type { IOption } from "@/interfaces/api.interface";
import { StatesProvider } from "@/providers/states.provider";

function CreateCity() {
  const navigate = useNavigate();
  const { createCity } = useCities();
  const { searchStates, states } = useStates();
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
