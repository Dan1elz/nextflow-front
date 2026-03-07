import { useNavigate } from "react-router-dom";

import { EntityTabsLayout } from "@/components/layouts/EntityTabsLayout";
import { ProductTab } from "@/pages/Product/Tabs/ProductTab";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";

function CreateProduct() {
  const navigate = useNavigate();

  const handleBack = () => navigate("/products");

  const tabs = [
    {
      value: "product",
      label: "Produto",
      content: <ProductTab mode="create" />,
    },
    {
      value: "stock-movements",
      label: "Movimentações",
      content: (
        <p className="text-muted-foreground text-sm">
          Salve o produto antes de gerenciar movimentações de estoque.
        </p>
      ),
    },
  ];

  return (
    <EntityTabsLayout
      title="Criar Produto"
      tabs={tabs}
      defaultTab="product"
      disabledTabs={["stock-movements"]}
      onBack={handleBack}
    />
  );
}

export default function CreateProductPageWrapper() {
  return (
    <ProductsProvider>
      <SuppliersProvider>
        <CategoriesProvider>
          <CreateProduct />
        </CategoriesProvider>
      </SuppliersProvider>
    </ProductsProvider>
  );
}
