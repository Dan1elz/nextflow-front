import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    selectedProduct,
    selectProduct,
    updateProduct,
    updateProductImage,
    removeProductImage,
  } = useProducts();
  const { searchSuppliersForOptions, getSupplierById } = useSuppliers();
  const { searchCategoriesForOptions, getCategoryById } = useCategories();
  const [isLoading, setIsLoading] = useState(false);

  const { options: supplierOptions, handleSearch: handleSearchSuppliers } =
    useSearchOptions<ISupplier>({
      searchFn: searchSuppliersForOptions,
      mapFn: (s) => ({ value: s.id ?? "", label: s.name }),
      selectFn: getSupplierById,
      errorLabel: "fornecedores",
      autoLoad: false,
      perPage: 50,
    });

  const { options: categoryOptions, handleSearch: handleSearchCategories } =
    useSearchOptions<ICategory>({
      searchFn: searchCategoriesForOptions,
      mapFn: (c) => ({ value: c.id ?? "", label: c.description }),
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
      handleError(error, "Erro ao buscar produto");
      navigate("/products");
    });
  }, [id, navigate, selectProduct]);

  const handleSubmit = async (data: ProductSchema) => {
    if (!id) return;
    try {
      setIsLoading(true);
      await updateProduct(id, {
        ...data,
        unitType: data.unitType as TUnitType,
      });
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
            key={`edit-${id}-${selectedProduct.image ?? ""}`}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isLoading={isLoading}
            initialData={selectedProduct}
            isEdit={true}
            productId={id}
            onImageUpload={
              id
                ? async (file) => {
                    try {
                      await updateProductImage(id, file);
                      handleSuccess("Imagem atualizada");
                    } catch (e) {
                      handleError(e, "Erro ao enviar imagem");
                    }
                  }
                : undefined
            }
            onImageRemove={
              id
                ? async () => {
                    try {
                      await removeProductImage(id);
                      handleSuccess("Imagem removida");
                    } catch (e) {
                      handleError(e, "Erro ao remover imagem");
                    }
                  }
                : undefined
            }
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
