import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ProductForm } from "@/components/forms/product-form";
import { useProducts } from "@/hooks/use-products";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCategories } from "@/hooks/use-categories";
import { useSearchOptions } from "@/hooks/use-search-options";
import { handleError, handleSuccess } from "@/utils/toast.helpers";
import type { ProductSchema } from "@/schemas/product.schema";
import type { ISupplier } from "@/interfaces/supplier.interface";
import type { ICategory } from "@/interfaces/category.interface";
import type { TUnitType } from "@/types/enums";

type ProductTabProps = {
  mode: "create" | "edit" | "view";
};

export function ProductTab({ mode }: ProductTabProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    selectedProduct,
    selectProduct,
    createProduct,
    updateProduct,
    updateProductImage,
    removeProductImage,
  } = useProducts();
  const { searchSuppliersForOptions, getSupplierById } = useSuppliers();
  const { searchCategoriesForOptions, getCategoryById } = useCategories();
  const [isLoading, setIsLoading] = useState(false);

  const {
    options: supplierOptions,
    handleSearch: handleSearchSuppliers,
    setOptions: setSupplierOptions,
  } = useSearchOptions<ISupplier>({
    searchFn: searchSuppliersForOptions,
    mapFn: (s) => ({ value: s.id ?? "", label: s.name }),
    selectFn: getSupplierById,
    errorLabel: "fornecedores",
    autoLoad: false,
    perPage: 50,
  });

  const {
    options: categoryOptions,
    handleSearch: handleSearchCategories,
    setOptions: setCategoryOptions,
  } = useSearchOptions<ICategory>({
    searchFn: searchCategoriesForOptions,
    mapFn: (c) => ({ value: c.id ?? "", label: c.description }),
    selectFn: getCategoryById,
    errorLabel: "categorias",
    autoLoad: false,
    perPage: 50,
  });

  // Pré-popula as opções com os dados já carregados do produto
  useEffect(() => {
    if (!selectedProduct) return;

    if (selectedProduct.supplier) {
      setSupplierOptions((prev) => {
        const exists = prev.some(
          (o) => String(o.value) === selectedProduct.supplier?.id
        );
        if (exists) return prev;
        return [
          {
            value: selectedProduct.supplier!.id ?? "",
            label: selectedProduct.supplier!.name,
          },
          ...prev,
        ];
      });
    }

    if (selectedProduct.categories && selectedProduct.categories.length > 0) {
      setCategoryOptions((prev) => {
        const newOpts = selectedProduct
          .categories!.filter(
            (c) => !prev.some((o) => String(o.value) === c.id)
          )
          .map((c) => ({ value: c.id ?? "", label: c.description }));
        if (newOpts.length === 0) return prev;
        return [...newOpts, ...prev];
      });
    }
  }, [selectedProduct, setSupplierOptions, setCategoryOptions]);

  useEffect(() => {
    if (mode === "create") return;
    if (!id) {
      navigate("/products");
      return;
    }
    selectProduct(id).catch((error) => {
      handleError(error, "Erro ao buscar produto");
      navigate("/products");
    });
  }, [mode, id, navigate, selectProduct]);

  const handleSubmit = async (data: ProductSchema) => {
    if (mode === "view") return;

    try {
      setIsLoading(true);
      if (mode === "create") {
        const created = await createProduct({
          ...data,
          unitType: data.unitType as TUnitType,
        });
        handleSuccess("Produto criado com sucesso");
        navigate(`/products/${created.id}/edit`);
      } else if (mode === "edit" && id) {
        await updateProduct(id, {
          ...data,
          unitType: data.unitType as TUnitType,
        });
        handleSuccess("Produto atualizado com sucesso");
        navigate("/products");
      }
    } catch (error) {
      handleError(
        error,
        mode === "create"
          ? "Erro ao criar produto"
          : "Erro ao atualizar produto"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (mode !== "create" && !selectedProduct) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <ProductForm
        key={
          mode === "create"
            ? "create"
            : `edit-${id}-${selectedProduct?.image ?? ""}`
        }
        onSubmit={handleSubmit}
        onBack={() => navigate("/products")}
        isLoading={isLoading}
        initialData={
          mode === "create" ? undefined : (selectedProduct ?? undefined)
        }
        isEdit={mode !== "create"}
        disabled={mode === "view"}
        productId={id}
        onImageUpload={
          mode === "edit" && id
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
          mode === "edit" && id
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
    </div>
  );
}
