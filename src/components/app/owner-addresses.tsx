import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { NavActionColumn } from "@/components/app/nav-action-column";
import { AddressForm } from "@/components/forms/address-form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAddresses } from "@/hooks/use-addresses";
import { useCityOptions } from "@/hooks/use-city-options";
import type { AddressResponseDto } from "@/interfaces/address.interface";
import { AddressesProvider } from "@/providers/addresses.provider";
import type { AddressFormData } from "@/schemas/address.schema";
import { viaCepService } from "@/services/viacep.service";
import type { TOwnerType } from "@/types/enums";
import { formatCep, formatOnlyNumbers } from "@/utils/format.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

type OwnerAddressesProps = {
  ownerType: TOwnerType;
  ownerId: string;
  readOnly?: boolean;
};

function OwnerAddressesContent({ readOnly = false }: { readOnly?: boolean }) {
  const {
    addresses,
    loadAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddresses();
  const { cityOptions, searchCities, findCityByIbge, keepCityOption } =
    useCityOptions();
  const [editing, setEditing] = useState<AddressResponseDto | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadAddresses().catch((error) =>
      handleError(error, "Erro ao buscar endereços")
    );
  }, [loadAddresses]);

  const handleLookupCep = useCallback(
    async (zipCode: string) => {
      const via = await viaCepService.getByCep(zipCode);
      const city = await findCityByIbge(via.ibge);
      return {
        street: via.logradouro,
        neighborhood: via.bairro,
        complement: via.complemento,
        cityId: city?.value,
      };
    },
    [findCityByIbge]
  );

  const handleSubmit = async (data: AddressFormData) => {
    const dto = {
      ...data,
      zipCode: formatOnlyNumbers(data.zipCode),
      complement: data.complement || null,
    };
    if (editing) {
      await updateAddress(editing.id, dto);
      handleSuccess("Endereço atualizado com sucesso");
      setEditing(null);
    } else {
      await createAddress(dto);
      handleSuccess("Endereço adicionado com sucesso");
    }
    setFormKey((key) => key + 1);
  };

  const handleEdit = useCallback(
    (row: AddressResponseDto) => {
      keepCityOption({
        value: row.cityId,
        label: `${row.cityName}/${row.stateAbbreviation}`,
      });
      setEditing(row);
    },
    [keepCityOption]
  );

  const handleDelete = useCallback(
    async (row: AddressResponseDto) => {
      try {
        await deleteAddress(row.id);
        handleSuccess("Endereço excluído com sucesso");
        setEditing((current) => (current?.id === row.id ? null : current));
      } catch (error) {
        handleError(error, "Erro ao excluir endereço");
      }
    },
    [deleteAddress]
  );

  const columns = useMemo<ColumnDef<AddressResponseDto>[]>(
    () => [
      {
        accessorKey: "street",
        header: "Endereço",
        cell: ({ row }) =>
          [row.original.street, row.original.number, row.original.complement]
            .filter(Boolean)
            .join(", "),
      },
      { accessorKey: "neighborhood", header: "Bairro" },
      {
        accessorKey: "cityName",
        header: "Cidade/UF",
        cell: ({ row }) =>
          `${row.original.cityName}/${row.original.stateAbbreviation}`,
      },
      {
        accessorKey: "zipCode",
        header: "CEP",
        cell: ({ row }) => formatCep(row.original.zipCode),
      },
      {
        accessorKey: "isMain",
        header: "Principal",
        cell: ({ row }) =>
          row.original.isMain ? <Badge>Principal</Badge> : "-",
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) =>
          readOnly ? null : (
            <NavActionColumn
              object={row.original}
              onEdit={handleEdit}
              onDelete={handleDelete}
              disableView
            />
          ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleDelete, handleEdit, readOnly]
  );

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && (
        <>
          <AddressForm
            key={editing?.id ?? `new-${formKey}`}
            initialData={editing}
            onSubmit={handleSubmit}
            onCancelEdit={editing ? () => setEditing(null) : undefined}
            cityOptions={cityOptions}
            onSearchCity={searchCities}
            onLookupCep={handleLookupCep}
          />
          <Separator />
        </>
      )}
      <DataTable
        columns={columns}
        data={addresses}
        page={1}
        totalPages={1}
        total={addresses.length}
        onPageChange={() => {}}
        disablePagination
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}

export function OwnerAddresses({
  ownerType,
  ownerId,
  readOnly,
}: OwnerAddressesProps) {
  return (
    <AddressesProvider ownerType={ownerType} ownerId={ownerId}>
      <OwnerAddressesContent readOnly={readOnly} />
    </AddressesProvider>
  );
}
