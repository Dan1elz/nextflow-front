import { useCallback, useState, type ReactNode } from "react";

import { SuppliersContext } from "@/contexts/suppliers.context";
import { useAuth } from "@/hooks/use-auth";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  SupplierListItemDto,
  SupplierRequestDto,
  SupplierResponseDto,
} from "@/interfaces/supplier.interface";
import { supplierService } from "@/services/supplier.service";

export function SuppliersProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<SupplierListItemDto[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierResponseDto | null>(null);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const searchSuppliers = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await supplierService.getAll(query, auth);
      setSuppliers(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth]
  );

  const searchSuppliersForOptions = useCallback(
    async (query?: IIndexParams) => {
      const response = await supplierService.getAll(query, auth);
      return { data: response.items || [], totalItems: response.total };
    },
    [auth]
  );

  const selectSupplier = useCallback(
    async (id: string) => {
      setSelectedSupplier(await supplierService.getById(id, auth));
    },
    [auth]
  );

  const getSupplierById = useCallback(
    (id: string) => supplierService.getById(id, auth),
    [auth]
  );

  const createSupplier = useCallback(
    (dto: SupplierRequestDto) => supplierService.create(dto, auth),
    [auth]
  );

  const updateSupplier = useCallback(
    (id: string, dto: SupplierRequestDto) =>
      supplierService.update(id, dto, auth),
    [auth]
  );

  const deleteSupplier = useCallback(
    (id: string) => supplierService.delete(id, auth),
    [auth]
  );

  const reactivateSupplier = useCallback(
    (id: string) => supplierService.reactivate(id, auth),
    [auth]
  );

  return (
    <SuppliersContext.Provider
      value={{
        suppliers,
        selectedSupplier,
        pagination,
        searchSuppliers,
        searchSuppliersForOptions,
        selectSupplier,
        getSupplierById,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        reactivateSupplier,
      }}
    >
      {children}
    </SuppliersContext.Provider>
  );
}
