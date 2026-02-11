import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/forms/product-form";
import { useProducts } from "@/hooks/use-products";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCategories } from "@/hooks/use-categories";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError } from "@/utils/toast.helpers";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";
import type { ISupplier } from "@/interfaces/supplier.interface";
import type { ICategory } from "@/interfaces/category.interface";

function ViewProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedProduct, selectProduct } = useProducts();
  const { searchSuppliersForOptions, getSupplierById } = useSuppliers();
  const { searchCategoriesForOptions, getCategoryById } = useCategories();

  const { options: supplierOptions, handleSearch: handleSearchSuppliers } =
    useSearchOptions<ISupplier>({
      searchFn: searchSuppliersForOptions,
      mapFn: (s) => ({ value: s.id ?? "", label: s.name ?? "" }),
      selectFn: getSupplierById,
      errorLabel: "fornecedores",
      autoLoad: false,
      perPage: 50,
    });

  const { options: categoryOptions, handleSearch: handleSearchCategories } =
    useSearchOptions<ICategory>({
      searchFn: searchCategoriesForOptions,
      mapFn: (c) => ({ value: c.id ?? "", label: c.description ?? "" }),
      selectFn: getCategoryById,
      errorLabel: "categorias",
      autoLoad: false,
      perPage: 50,
    });

  const handleBack = () => navigate("/products");

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
            onSubmit={() => {}}
            onBack={handleBack}
            isLoading={false}
            initialData={selectedProduct}
            isEdit={false}
            disabled={true}
            supplierOptions={supplierOptions}
            onSearchSuppliers={handleSearchSuppliers}
            categoryOptions={categoryOptions}
            onSearchCategory={handleSearchCategories}
          />
        </CardContent>
      </Card>
    </div>
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
