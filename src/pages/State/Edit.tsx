import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateForm } from "@/components/forms/state-form";
import { useStates } from "@/hooks/use-states";
import { useCountries } from "@/hooks/use-countries";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { StatesProvider } from "@/providers/states.provider";
import { CountriesProvider } from "@/providers/countries.provider";
import type { StateSchema } from "@/schemas/state.schema";
import type { IState } from "@/interfaces/locations.interface";
import type { IOption } from "@/interfaces/api.interface";

function EditState() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedState, selectState, updateState } = useStates();
  const { searchCountries, countries } = useCountries();
  const [isLoading, setIsLoading] = useState(false);

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
            onSearch={handleSearchCountries}
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
