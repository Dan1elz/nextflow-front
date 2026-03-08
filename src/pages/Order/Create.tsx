import { OrderForm } from "@/components/forms/order-form";
import { ClientsProvider } from "@/providers/clients.provider";
import { ProductsProvider } from "@/providers/products.provider";
import { OrdersProvider } from "@/providers/orders.provider";

function CreateOrder() {
  return (
    <div className="container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300 p-4 pt-6">
      <OrderForm />
    </div>
  );
}

export default function CreateOrderPageWrapper() {
  return (
    <ClientsProvider>
      <ProductsProvider>
        <OrdersProvider>
          <CreateOrder />
        </OrdersProvider>
      </ProductsProvider>
    </ClientsProvider>
  );
}
