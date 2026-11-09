import { useCallback, useState, type ReactNode } from "react";

import { PurchaseOrdersContext } from "@/contexts/purchase-orders.context";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  PurchaseOrderListItemDto,
  ReceivePurchaseOrderDto,
  SavePurchaseOrderDto,
} from "@/interfaces/purchase-order.interface";
import { productService } from "@/services/product.service";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { storeService } from "@/services/store.service";
import { supplierService } from "@/services/supplier.service";

export function PurchaseOrdersProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState<
    PurchaseOrderListItemDto[]
  >([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();
  const { storeId } = useCurrentStore();
  const auth = token ?? undefined;

  const searchPurchaseOrders = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await purchaseOrderService.getAll(query, storeId, auth);
      setPurchaseOrders(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth, storeId]
  );

  const getPurchaseOrder = useCallback(
    (id: string) => purchaseOrderService.getById(id, auth),
    [auth]
  );

  const getPurchaseOrderForm = useCallback(
    (id: string) => purchaseOrderService.getForm(id, auth),
    [auth]
  );

  const createPurchaseOrder = useCallback(
    (dto: SavePurchaseOrderDto) => purchaseOrderService.create(dto, auth),
    [auth]
  );

  const updatePurchaseOrder = useCallback(
    (id: string, dto: SavePurchaseOrderDto) =>
      purchaseOrderService.update(id, dto, auth),
    [auth]
  );

  const sendPurchaseOrder = useCallback(
    (id: string, version: number) =>
      purchaseOrderService.send(id, version, auth),
    [auth]
  );

  const cancelPurchaseOrder = useCallback(
    (id: string, version: number, reason: string) =>
      purchaseOrderService.cancel(id, version, reason, auth),
    [auth]
  );

  const receivePurchaseOrder = useCallback(
    (id: string, dto: ReceivePurchaseOrderDto) =>
      purchaseOrderService.receive(id, dto, auth),
    [auth]
  );

  const getItemSuggestion = useCallback(
    (supplierId: string, variantId: string, store: string) =>
      purchaseOrderService.itemSuggestion(supplierId, variantId, store, auth),
    [auth]
  );

  const searchVariantOptions = useCallback(
    (supplierId: string, search: string, onlyLinked: boolean) =>
      purchaseOrderService.variantOptions(supplierId, search, onlyLinked, auth),
    [auth]
  );

  const searchSupplierOptions = useCallback(
    (search: string) => supplierService.options(search, auth),
    [auth]
  );

  const getLocationOptions = useCallback(
    () => purchaseOrderService.locationOptions(auth),
    [auth]
  );

  const getDefaultReceiveLocationId = useCallback(
    async (store: string) =>
      (await storeService.getById(store, auth)).defaultReceiveLocationId ??
      null,
    [auth]
  );

  const getProductSuppliers = useCallback(
    (productId: string) => productService.suppliers(productId, auth),
    [auth]
  );

  return (
    <PurchaseOrdersContext.Provider
      value={{
        purchaseOrders,
        pagination,
        searchPurchaseOrders,
        getPurchaseOrder,
        getPurchaseOrderForm,
        createPurchaseOrder,
        updatePurchaseOrder,
        sendPurchaseOrder,
        cancelPurchaseOrder,
        receivePurchaseOrder,
        getItemSuggestion,
        searchVariantOptions,
        searchSupplierOptions,
        getLocationOptions,
        getDefaultReceiveLocationId,
        getProductSuppliers,
      }}
    >
      {children}
    </PurchaseOrdersContext.Provider>
  );
}
