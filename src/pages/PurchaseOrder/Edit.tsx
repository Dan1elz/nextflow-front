import { useParams } from "react-router-dom";
import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { ProductsProvider } from "@/providers/products.provider";
import { PurchaseOrdersProvider } from "@/providers/purchase-orders.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";

function EditPurchaseOrder() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-300 p-4 pt-6">
      <PurchaseOrderForm mode="edit" purchaseOrderId={id} />
    </div>
  );
}

export default function EditPurchaseOrderPageWrapper() {
  return (
    <SuppliersProvider>
      <ProductsProvider>
        <CategoriesProvider>
          <PurchaseOrdersProvider>
            <EditPurchaseOrder />
          </PurchaseOrdersProvider>
        </CategoriesProvider>
      </ProductsProvider>
    </SuppliersProvider>
  );
}
