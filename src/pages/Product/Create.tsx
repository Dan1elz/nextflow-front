import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ProductForm,
  type ProductImageChange,
} from "@/components/forms/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import type { ProductFormOptionsDto } from "@/interfaces/product.interface";
import { ProductsProvider } from "@/providers/products.provider";
import type { ProductFormData } from "@/schemas/product.schema";
import { emptyProductForm, toRequestDto } from "@/utils/product.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

function CreateProduct() {
  const navigate = useNavigate();
  const { getForm, createProduct, uploadImage } = useProducts();
  const [options, setOptions] = useState<ProductFormOptionsDto | null>(null);

  useEffect(() => {
    getForm()
      .then((form) => setOptions(form.options))
      .catch((error) => handleError(error, "Erro ao abrir o formulário"));
  }, [getForm]);

  const handleSubmit = async (
    data: ProductFormData,
    image: ProductImageChange
  ) => {
    const product = await createProduct(toRequestDto(data));
    handleSuccess("Produto criado com sucesso");

    if (image.file) {
      try {
        await uploadImage(product.id, image.file);
      } catch (error) {
        // O produto já foi gravado: abre a edição para tentar a imagem de novo.
        handleError(error, "Produto criado, mas a imagem não foi enviada");
        navigate(`/products/${product.id}/edit`);
        return;
      }
    }
    navigate(`/products/${product.id}/view`);
  };

  if (!options) return <Skeleton className="h-96 w-full" />;

  return (
    <ProductForm
      initialData={emptyProductForm()}
      options={options}
      isEdit={false}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/products")}
    />
  );
}

export default function CreateProductPageWrapper() {
  return (
    <ProductsProvider>
      <CreateProduct />
    </ProductsProvider>
  );
}
