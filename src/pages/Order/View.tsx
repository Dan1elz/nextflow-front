import { useParams } from "react-router-dom";
import { OrderForm } from "@/components/forms/order-form";
import { ClientsProvider } from "@/providers/clients.provider";
import { ProductsProvider } from "@/providers/products.provider";
import { OrdersProvider } from "@/providers/orders.provider";

function ViewOrder() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300 p-4 pt-6">
      <OrderForm mode="view" orderId={id} />
    </div>
  );
}

export default function ViewOrderPageWrapper() {
  return (
    <ClientsProvider>
      <ProductsProvider>
        <OrdersProvider>
          <ViewOrder />
        </OrdersProvider>
      </ProductsProvider>
    </ClientsProvider>
  );
}
