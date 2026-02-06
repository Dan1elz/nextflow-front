import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/forms/product-form";
import { useProducts } from "@/hooks/use-products";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCategories } from "@/hooks/use-categories";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";
import type { ProductSchema } from "@/schemas/product.schema";

function CreateProduct() {
  const navigate = useNavigate();
  const { createProduct } = useProducts();
  const { suppliers, searchSuppliers } = useSuppliers();
  const { categories, searchCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/products");
  };

  const handleSubmit = async (data: ProductSchema) => {
    try {
      setIsLoading(true);

      // O createProduct do seu Provider já lida com IProductRequest (incluindo o File)
      await createProduct(data);

      handleSuccess("Produto criado com sucesso");
      navigate("/products");
    } catch (error) {
      handleError(error, "Erro ao criar produto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            isEdit={false}
            // Passamos as listas e funções de busca para os SearchSelects internos
            suppliers={suppliers}
            onSearchSuppliers={searchSuppliers}
            categories={categories}
            onSearchCategories={searchCategories}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper com todos os Providers necessários para o formulário funcionar
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
