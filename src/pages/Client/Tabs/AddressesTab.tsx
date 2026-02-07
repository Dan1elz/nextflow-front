import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { AddressForm } from "@/components/forms/address-form";
import { AddressesProvider } from "@/providers/addresses.provider";
import { StatesProvider } from "@/providers/states.provider";
import { CitiesProvider } from "@/providers/cities.provider";
import { useAddresses } from "@/hooks/use-addresses";
import { useStates } from "@/hooks/use-states";
import { useCities } from "@/hooks/use-cities";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { viaCepService } from "@/services/viacep.service";
import type { IAddress } from "@/interfaces/address.interface";
import type { AddressFormData } from "@/schemas/address.schema";
import { formatCep, formatOnlyNumbers } from "@/utils/format.helpers";
import type { IState } from "@/interfaces/locations.interface";
import type { ICity } from "@/interfaces/locations.interface";

const PER_PAGE_MAX = 9999;

const mapStateToOption = (s: IState) => ({
  value: s.id ?? "",
  label: s.name,
});

const mapCityToOption = (c: ICity) => ({
  value: c.id ?? "",
  label: c.name,
});

type AddressesTabProps = {
  clientId: string | null;
  disabled?: boolean;
};

function AddressesTabContent({
  clientId,
  disabled = false,
}: AddressesTabProps) {
  const {
    addresses,
    searchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    resolveFromCep,
  } = useAddresses();
  const { searchStatesForOptions, getStateById } = useStates();
  const { searchCitiesForOptions, getCityById } = useCities();

  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stateId, setStateId] = useState<string>("");
  const selectedCityIdRef = useRef<string>("");
  const [addFormKey, setAddFormKey] = useState(0);
  const [, setSelectedIds] = useState<string[]>([]);

  const {
    options: statesOptions,
    handleSearch: handleSearchStates,
    setOptions: setStatesOptions,
  } = useSearchOptions<IState>({
    searchFn: searchStatesForOptions,
    mapFn: mapStateToOption,
    selectFn: getStateById,
    errorLabel: "estados",
    autoLoad: false,
    perPage: 50,
  });

  const citiesInitialFilters = useMemo(
    () => (stateId ? { stateId } : undefined),
    [stateId]
  );

  const {
    options: citiesOptions,
    handleSearch: handleSearchCities,
    setOptions: setCitiesOptions,
  } = useSearchOptions<ICity>({
    searchFn: searchCitiesForOptions,
    mapFn: mapCityToOption,
    selectFn: getCityById,
    errorLabel: "cidades",
    autoLoad: false,
    perPage: 50,
    initialFilters: citiesInitialFilters,
    enabled: Boolean(stateId),
  });

  const handleCityChange = useCallback((id: string) => {
    selectedCityIdRef.current = id;
  }, []);

  const handleStateChange = useCallback((id: string) => {
    setStateId(id);
    selectedCityIdRef.current = "";
  }, []);

  const handleAutoFillByCep = useCallback(
    async (zipCodeNumbers: string) => {
      const via = await viaCepService.getByCep(zipCodeNumbers);
      const resolved = await resolveFromCep({
        stateAcronym: via.uf,
        cityName: via.localidade,
        cityIbgeCode: via.ibge,
      });

      if (resolved.stateId && resolved.stateName) {
        setStatesOptions((prev) => {
          const exists = prev.some((o) => String(o.value) === resolved.stateId);
          if (exists) return prev;
          return [
            { value: resolved.stateId, label: resolved.stateName },
            ...prev,
          ];
        });
      }

      if (resolved.cityId && resolved.cityName) {
        setCitiesOptions((prev) => {
          const exists = prev.some((o) => String(o.value) === resolved.cityId);
          if (exists) return prev;
          return [
            { value: resolved.cityId, label: resolved.cityName },
            ...prev,
          ];
        });
      }

      return {
        street: via.logradouro,
        district: via.bairro,
        complement: via.complemento,
        stateId: resolved.stateId,
        cityId: resolved.cityId,
      };
    },
    [resolveFromCep, setCitiesOptions, setStatesOptions]
  );

  useEffect(() => {
    if (!stateId) {
      setCitiesOptions([]);
      return;
    }
    setCitiesOptions([]);
    handleSearchCities("", selectedCityIdRef.current || undefined).catch(
      (err) => {
        handleError(err, "Erro ao buscar cidades");
      }
    );
  }, [stateId, handleSearchCities, setCitiesOptions]);

  const fetchAddresses = useCallback(() => {
    searchAddresses({
      filters: {},
      page: 1,
      perPage: PER_PAGE_MAX,
    }).catch((err) => {
      handleError(err, "Erro ao buscar endereços");
    });
  }, [searchAddresses]);

  useEffect(() => {
    if (!clientId) return;
    fetchAddresses();
  }, [clientId, fetchAddresses]);

  const list = useMemo(() => {
    if (!clientId) return [];
    return addresses.filter(
      (a) => a.clientId === clientId || String(a.clientId) === clientId
    );
  }, [addresses, clientId]);

  const handleSubmit = useCallback(
    async (data: AddressFormData) => {
      if (!clientId) return;
      try {
        setIsLoading(true);
        const zipCode = formatOnlyNumbers(data.zipCode);
        const payload: IAddress = {
          clientId,
          description: data.description,
          street: data.street,
          number: data.number,
          district: data.district,
          stateId: data.stateId,
          cityId: data.cityId,
          complement: data.complement ?? "",
          zipCode:
            zipCode.length === 8
              ? `${zipCode.slice(0, 5)}-${zipCode.slice(5)}`
              : zipCode,
        };
        if (editingAddress?.id) {
          await updateAddress(editingAddress.id, {
            ...payload,
            id: editingAddress.id,
          });
          handleSuccess("Endereço atualizado com sucesso");
          setEditingAddress(null);
        } else {
          await createAddress(payload);
          handleSuccess("Endereço adicionado com sucesso");
          setAddFormKey((k) => k + 1);
        }
        fetchAddresses();
      } catch (err) {
        handleError(err, "Erro ao salvar endereço");
      } finally {
        setIsLoading(false);
      }
    },
    [clientId, editingAddress, createAddress, updateAddress, fetchAddresses]
  );

  const handleEdit = useCallback((row: IAddress) => {
    setEditingAddress(row);
    setStateId(row.stateId ?? "");
    selectedCityIdRef.current = row.cityId ?? "";
  }, []);

  const handleDelete = useCallback(
    async (row: IAddress) => {
      if (!row.id) return;
      try {
        await deleteAddress(row.id);
        handleSuccess("Endereço excluído com sucesso");
        if (editingAddress?.id === row.id) setEditingAddress(null);
        fetchAddresses();
      } catch (err) {
        handleError(err, "Erro ao excluir endereço");
      }
    },
    [deleteAddress, editingAddress, fetchAddresses]
  );

  const handleSearchCity = useCallback(
    (q: string) => handleSearchCities(q, editingAddress?.cityId ?? undefined),
    [handleSearchCities, editingAddress?.cityId]
  );

  const columns = useMemo<ColumnDef<IAddress>[]>(
    () => [
      { accessorKey: "description", header: "Descrição" },
      { accessorKey: "street", header: "Rua" },
      { accessorKey: "number", header: "Número" },
      { accessorKey: "district", header: "Bairro" },
      {
        accessorKey: "zipCode",
        header: "CEP",
        cell: ({ row }) => formatCep(row.original.zipCode),
      },
      ...(disabled
        ? []
        : [
            {
              id: "actions",
              header: "Ações",
              cell: ({ row }) => (
                <NavActionColumn
                  object={row.original}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  disableView
                />
              ),
              enableSorting: false,
              enableHiding: false,
            } as ColumnDef<IAddress>,
          ]),
    ],
    [disabled, handleEdit, handleDelete]
  );

  if (!clientId) {
    return (
      <p className="text-muted-foreground text-sm">
        Salve o cliente antes de gerenciar endereços.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-4">
          {editingAddress ? "Editar endereço" : "Adicionar endereço"}
        </h3>
        <AddressForm
          key={editingAddress?.id ?? `new-${addFormKey}`}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          initialData={editingAddress}
          disabled={disabled}
          onCancelEdit={
            editingAddress && !disabled
              ? () => {
                  setEditingAddress(null);
                  handleStateChange("");
                }
              : undefined
          }
          stateData={statesOptions}
          onSearchState={handleSearchStates}
          cityData={citiesOptions}
          onSearchCity={handleSearchCity}
          onStateChange={handleStateChange}
          onCityChange={handleCityChange}
          onAutoFillByCep={handleAutoFillByCep}
        />
      </div>

      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={list}
          page={1}
          totalPages={1}
          total={list.length}
          onPageChange={() => {}}
          disablePagination
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
}

export function AddressesTab(props: AddressesTabProps) {
  return (
    <AddressesProvider>
      <StatesProvider>
        <CitiesProvider>
          <AddressesTabContent {...props} />
        </CitiesProvider>
      </StatesProvider>
    </AddressesProvider>
  );
}
