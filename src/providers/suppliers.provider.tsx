import { useState, useCallback, type ReactNode } from "react";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";
import type { ISupplier } from "@/interfaces/supplier.interface";
import { SuppliersContext } from "@/contexts/suppliers.context";
import { supplierService } from "@/services/supplier.service";

export function SuppliersProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(
    null
  );
  const { token } = useAuth();

  const searchSuppliers = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await supplierService.getAll(query, token ?? undefined);
      setSuppliers(response.data || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const searchSuppliersForOptions = useCallback(
    async (
      query?: IIndexParams
    ): Promise<{ data: ISupplier[]; totalItems: number }> => {
      const response = await supplierService.getAll(query, token ?? undefined);
      return {
        data: response.data || [],
        totalItems: response.totalItems,
      };
    },
    [token]
  );

  const selectSupplier = useCallback(
    async (id: string): Promise<void> => {
      const data = await supplierService.getById(id, token ?? undefined);
      setSelectedSupplier(data);
    },
    [token]
  );

  const getSupplierById = useCallback(
    async (id: string): Promise<ISupplier> => {
      return supplierService.getById(id, token ?? undefined);
    },
    [token]
  );

  const createSupplier = useCallback(
    async (supplier: ISupplier): Promise<ISupplier> => {
      const data = await supplierService.create(supplier, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateSupplier = useCallback(
    async (id: string, supplier: ISupplier): Promise<ISupplier> => {
      const data = await supplierService.update(
        id,
        supplier,
        token ?? undefined
      );
      return data;
    },
    [token]
  );

  const deleteSupplier = useCallback(
    async (id: string): Promise<void> => {
      await supplierService.delete(id, token ?? undefined);
    },
    [token]
  );

  return (
    <SuppliersContext.Provider
      value={{
        suppliers,
        pagination,
        selectedSupplier,
        searchSuppliers,
        searchSuppliersForOptions,
        selectSupplier,
        getSupplierById,
        createSupplier,
        updateSupplier,
        deleteSupplier,
      }}
    >
      {children}
    </SuppliersContext.Provider>
  );
}
