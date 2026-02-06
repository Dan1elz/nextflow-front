import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/forms/product-form";
import { useProducts } from "@/hooks/use-products";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCategories } from "@/hooks/use-categories";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";
import { handleError } from "@/utils/toast.helpers";

function ViewProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedProduct, selectProduct } = useProducts();

  // Hooks necessários para carregar os dados contextuais (labels de fornecedor/categoria)
  const { suppliers, searchSuppliers } = useSuppliers();
  const { categories, searchCategories } = useCategories();

  const handleBack = () => {
    navigate("/products");
  };

  useEffect(() => {
    if (!id) {
      navigate("/products");
      return;
    }

    selectProduct(id).catch((error) => {
      handleError(error, "Erro ao buscar detalhes do produto");
      navigate("/products");
    });
  }, [id, navigate, selectProduct]);

  if (!selectedProduct) {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground italic">
              Carregando detalhes do produto...
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
          <CardTitle>Visualizar Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={() => {}} // Função vazia pois é apenas visualização
            onBack={handleBack}
            isLoading={false}
            initialData={selectedProduct}
            isEdit={false}
            disabled={true} // Bloqueia todos os campos do formulário
            // Props para que o formulário exiba os labels corretamente
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

// Wrapper consolidado com todos os contextos necessários
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
