import { useParams } from "react-router-dom";
import { OrderForm } from "@/components/forms/order-form";
import { ClientsProvider } from "@/providers/clients.provider";
import { ProductsProvider } from "@/providers/products.provider";
import { OrdersProvider } from "@/providers/orders.provider";

function EditOrder() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300 p-4 pt-6">
      <OrderForm mode="edit" orderId={id} />
    </div>
  );
}

export default function EditOrderPageWrapper() {
  return (
    <ClientsProvider>
      <ProductsProvider>
        <OrdersProvider>
          <EditOrder />
        </OrdersProvider>
      </ProductsProvider>
    </ClientsProvider>
  );
}
