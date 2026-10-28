import { useNavigate, useParams } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { ProductTab } from "@/pages/Product/Tabs/ProductTab";
import { StockMovementsTab } from "@/pages/Product/Tabs/StockMovementsTab";
import { ForecastTab } from "@/pages/Product/Tabs/ForecastTab";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";
import { useProducts } from "@/hooks/use-products";

function ViewProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedProduct } = useProducts();

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
      content: (
        <StockMovementsTab
          productId={id ?? null}
          productName={selectedProduct?.name}
          disabled
        />
      ),
    },
    {
      value: "forecast",
      label: "Previsão",
      content: (
        <ForecastTab
          productId={id ?? null}
          currentStock={selectedProduct?.quantity}
          unitType={selectedProduct?.unitType}
        />
      ),
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
