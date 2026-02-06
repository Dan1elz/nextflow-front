import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedProduct, selectProduct, updateProduct } = useProducts();
  const { suppliers, searchSuppliers } = useSuppliers();
  const { categories, searchCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigate("/products");
  };

  // Carrega os dados do produto ao montar o componente
  useEffect(() => {
    if (!id) {
      navigate("/products");
      return;
    }

    selectProduct(id).catch((error) => {
      handleError(error, "Erro ao buscar produto");
      navigate("/products");
    });
  }, [id, navigate, selectProduct]);

  const handleSubmit = async (data: ProductSchema) => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Enviamos o 'data' (ProductSchema) diretamente pois o seu service
      // já está preparado para converter o IProductRequest em FormData
      await updateProduct(id, data);

      handleSuccess("Produto atualizado com sucesso");
      navigate("/products");
    } catch (error) {
      handleError(error, "Erro ao atualizar produto");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedProduct) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground italic">
              Carregando dados do produto...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            initialData={selectedProduct}
            isEdit={true}
            // Props para os SearchSelects funcionarem na edição
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

export default function EditProductPageWrapper() {
  return (
    <ProductsProvider>
      <SuppliersProvider>
        <CategoriesProvider>
          <EditProduct />
        </CategoriesProvider>
      </SuppliersProvider>
    </ProductsProvider>
  );
}
