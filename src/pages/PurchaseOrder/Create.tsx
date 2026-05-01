import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { ProductsProvider } from "@/providers/products.provider";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";

function CreatePurchaseOrder() {
  return (
    <div className="container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300 p-4 pt-6">
      <PurchaseOrderForm />
    </div>
  );
}

export default function CreatePurchaseOrderPageWrapper() {
  return (
    <SuppliersProvider>
      <ProductsProvider>
        <CategoriesProvider>
          <PurchaseOrdersProvider>
            <CreatePurchaseOrder />
          </PurchaseOrdersProvider>
        </CategoriesProvider>
      </ProductsProvider>
    </SuppliersProvider>
  );
}
