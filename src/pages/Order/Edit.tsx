import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { OrderForm } from "@/components/forms/order-form";
import { ClientsProvider } from "@/providers/clients.provider";
import { ProductsProvider } from "@/providers/products.provider";
import { OrdersProvider } from "@/providers/orders.provider";
import { SalesProvider } from "@/providers/sales.provider";
import { useSales } from "@/hooks/use-sales";

function EditOrder() {
  const { id } = useParams<{ id: string }>();
  const { searchSalesForOptions } = useSales();

  const handleFetchAssociatedSale = useCallback(
    async (orderId: string) => {
      const res = await searchSalesForOptions({
        filters: { orderId },
        perPage: 1,
      });
      return res.data && res.data.length > 0 ? res.data[0] : null;
    },
    [searchSalesForOptions]
  );

  return (
    <div className="container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300 p-4 pt-6">
      <OrderForm
        mode="edit"
        orderId={id}
        onFetchAssociatedSale={handleFetchAssociatedSale}
      />
    </div>
  );
}

export default function EditOrderPageWrapper() {
  return (
    <ClientsProvider>
      <ProductsProvider>
        <OrdersProvider>
          <SalesProvider>
            <EditOrder />
          </SalesProvider>
        </OrdersProvider>
      </ProductsProvider>
    </ClientsProvider>
  );
}
