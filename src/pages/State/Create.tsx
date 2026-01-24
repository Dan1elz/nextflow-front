import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateForm } from "@/components/forms/state-form";
import { useStates } from "@/hooks/use-states";
import { useCountries } from "@/hooks/use-countries";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IState } from "@/interfaces/locations.interface";
import { StatesProvider } from "@/providers/states.provider";
import { CountriesProvider } from "@/providers/countries.provider";
import type { StateSchema } from "@/schemas/state.schema";
import type { IOption } from "@/interfaces/api.interface";

function CreateState() {
  const navigate = useNavigate();
  const { createState } = useStates();
  const { searchCountries, countries } = useCountries();
  const [isLoading, setIsLoading] = useState(false);

  const countriesOptions: IOption[] = useMemo(() => {
    return countries.map((country) => ({
      value: country.id ?? "",
      label: country.name,
    }));
  }, [countries]);

  const handleBack = () => {
    navigate("/state");
  };

  const handleSubmit = async (data: StateSchema) => {
    try {
      setIsLoading(true);
      const stateData: IState = {
        name: data.name,
        acronym: data.acronym,
        ibgeCode: data.ibgeCode,
        countryId: data.countryId,
        country: null,
      };

      await createState(stateData);
      handleSuccess("Estado criado com sucesso");
      navigate("/state");
    } catch (error) {
      handleError(error, "Erro ao criar estado");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <StateForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            isEdit={false}
            data={countriesOptions}
            onSearch={handleSearchCountries}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateStatePageWrapper() {
  return (
    <StatesProvider>
      <CountriesProvider>
        <CreateState />
      </CountriesProvider>
    </StatesProvider>
  );
}
