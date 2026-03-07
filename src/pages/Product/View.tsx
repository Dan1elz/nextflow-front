import { useNavigate, useParams } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { ProductTab } from "@/pages/Product/Tabs/ProductTab";
import { StockMovementsTab } from "@/pages/Product/Tabs/StockMovementsTab";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";

function ViewProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const handleBack = () => navigate("/products");

  const tabs = [
    {
      value: "product",
      label: "Produto",
      content: <ProductTab mode="view" />,
    },
    {
      value: "stock-movements",
      label: "Movimentações",
      content: <StockMovementsTab productId={id ?? null} disabled />,
    },
  ];

  return (
    <EntityTabsLayout
      title="Visualizar Produto"
      tabs={tabs}
      defaultTab="product"
      onBack={handleBack}
    />
  );
}

export default function ViewProductPageWrapper() {
  return (
    <ProductsProvider>
      <SuppliersProvider>
        <CategoriesProvider>
          <ViewProduct />
        </CategoriesProvider>
      </SuppliersProvider>
    </ProductsProvider>
  );
}
