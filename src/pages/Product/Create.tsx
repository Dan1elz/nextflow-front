import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/forms/product-form";
import { useProducts } from "@/hooks/use-products";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCategories } from "@/hooks/use-categories";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import { ProductsProvider } from "@/providers/products.provider";
import { SuppliersProvider } from "@/providers/suppliers.provider";
import { CategoriesProvider } from "@/providers/categories.provider";
import type { ProductSchema } from "@/schemas/product.schema";
import type { ISupplier } from "@/interfaces/supplier.interface";
import type { ICategory } from "@/interfaces/category.interface";
import type { TUnitType } from "@/types/enums";

function CreateProduct() {
  const navigate = useNavigate();
  const { createProduct } = useProducts();
  const { searchSuppliersForOptions, getSupplierById } = useSuppliers();
  const { searchCategoriesForOptions, getCategoryById } = useCategories();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (data: ProductSchema) => {
    try {
      setIsLoading(true);
      await createProduct({
        ...data,
        unitType: data.unitType as TUnitType,
      });
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
