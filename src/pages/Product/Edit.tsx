import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ProductForm,
  type ProductImageChange,
} from "@/components/forms/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import type { ProductFormDto } from "@/interfaces/product.interface";
import { ProductsProvider } from "@/providers/products.provider";
import type { ProductFormData } from "@/schemas/product.schema";
import { toFormValues, toRequestDto } from "@/utils/product.helpers";
import { handleError, handleSuccess } from "@/utils/toast.helpers";

function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getForm, updateProduct, uploadImage, removeImage } = useProducts();
  const [form, setForm] = useState<ProductFormDto | null>(null);

  useEffect(() => {
    if (!id) return;
    getForm(id)
      .then(setForm)
      .catch((error) => handleError(error, "Erro ao abrir o produto"));
  }, [getForm, id]);

  const handleSubmit = async (
    data: ProductFormData,
    image: ProductImageChange
  ) => {
    if (!id) return;
    await updateProduct(id, toRequestDto(data));
    handleSuccess("Produto atualizado com sucesso");

    try {
      if (image.file) await uploadImage(id, image.file);
      else if (image.touched) await removeImage(id);
    } catch (error) {
      handleError(error, "Produto salvo, mas a imagem não foi atualizada");
      return;
    }
    navigate(`/products/${id}/view`);
  };

  if (!form) return <Skeleton className="h-96 w-full" />;

  return (
    <ProductForm
      initialData={toFormValues(form)}
      initialImageUrl={form.imageUrl}
      options={form.options}
      isEdit
      onSubmit={handleSubmit}
      onCancel={() => navigate("/products")}
    />
  );
}

export default function EditProductPageWrapper() {
  return (
    <ProductsProvider>
      <EditProduct />
    </ProductsProvider>
  );
}
