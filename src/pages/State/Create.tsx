import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateForm } from "@/components/forms/state-form";
import { useStates } from "@/hooks/use-states";
import { useCountries } from "@/hooks/use-countries";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { IState } from "@/interfaces/locations.interface";
import { StatesProvider } from "@/providers/states.provider";
import { CountriesProvider } from "@/providers/countries.provider";
import type { StateSchema } from "@/schemas/state.schema";
import type { ICountry } from "@/interfaces/locations.interface";

function CreateState() {
  const navigate = useNavigate();
  const { createState } = useStates();
  const { searchCountriesForOptions, getCountryById } = useCountries();
  const [isLoading, setIsLoading] = useState(false);

  const { options: countriesOptions, handleSearch: handleSearchCountries } =
    useSearchOptions<ICountry>({
      searchFn: searchCountriesForOptions,
      mapFn: (country) => ({
        value: country.id ?? "",
        label: country.name,
      }),
      selectFn: getCountryById,
      errorLabel: "países",
      autoLoad: false,
      perPage: 50,
    });

  const handleBack = () => {
    navigate("/states");
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
      navigate("/states");
    } catch (error) {
      handleError(error, "Erro ao criar estado");
    } finally {
      setIsLoading(false);
    }
  };

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
