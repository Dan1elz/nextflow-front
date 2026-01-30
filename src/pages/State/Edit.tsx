import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateForm } from "@/components/forms/state-form";
import { useStates } from "@/hooks/use-states";
import { useCountries } from "@/hooks/use-countries";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { StatesProvider } from "@/providers/states.provider";
import { CountriesProvider } from "@/providers/countries.provider";
import type { StateSchema } from "@/schemas/state.schema";
import type { IState } from "@/interfaces/locations.interface";
import type { ICountry } from "@/interfaces/locations.interface";

function EditState() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedState, selectState, updateState } = useStates();
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
      autoLoad: true,
      perPage: 50,
    });

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

  const handleSubmit = async (data: StateSchema) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const stateData: IState = {
        name: data.name,
        acronym: data.acronym,
        ibgeCode: data.ibgeCode,
        countryId: data.countryId,
        country: null,
      };

      await updateState(id, stateData);
      handleSuccess("Estado atualizado com sucesso");
      navigate("/states");
    } catch (error) {
      handleError(error, "Erro ao atualizar estado");
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle>Editar Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <StateForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            initialData={selectedState}
            isEdit={true}
            data={countriesOptions}
            onSearch={async (query: string) => {
              await handleSearchCountries(query, selectedState?.countryId);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditStatePageWrapper() {
  return (
    <StatesProvider>
      <CountriesProvider>
        <EditState />
      </CountriesProvider>
    </StatesProvider>
  );
}
