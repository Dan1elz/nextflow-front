import { BaseService } from "./base.service";
import { ApiService } from "./api.service";
import type { IProduct } from "@/interfaces/product.interface";

const baseService = new BaseService<IProduct>("products");
const apiService = new ApiService();

function toCreateFormData(product: Partial<IProduct>): FormData {
  const fd = new FormData();
  if (product.supplierId) fd.append("SupplierId", product.supplierId);
  if (product.productCode) fd.append("ProductCode", product.productCode);
  if (product.name) fd.append("Name", product.name);
  if (product.description) fd.append("Description", product.description);
  if (product.quantity !== undefined && product.quantity !== null)
    fd.append("Quantity", String(product.quantity));
  if (product.unitType !== undefined && product.unitType !== null)
    fd.append("UnitType", String(product.unitType));
  if (product.price !== undefined && product.price !== null)
    fd.append("Price", String(product.price));
  if (product.validity) fd.append("Validity", product.validity);
  const categoryIds = product.categoryIds ?? [];
  for (const id of categoryIds) if (id) fd.append("CategoryIds", id);
  if (product.image instanceof File) fd.append("Image", product.image);
  return fd;
}

function toUpdateBody(product: Partial<IProduct>): Record<string, unknown> {
  return {
    supplierId: product.supplierId,
    productCode: product.productCode,
    name: product.name,
    description: product.description,
    categoryIds: product.categoryIds ?? [],
    quantity: product.quantity,
    unitType: product.unitType,
    price: product.price,
    validity: product.validity || null,
  };
}

export const productService = {
  delete: baseService.delete.bind(baseService),
  getAll: baseService.getAll.bind(baseService),
  getById: baseService.getById.bind(baseService),
  async create(product: Partial<IProduct>, token?: string): Promise<IProduct> {
    const fd = toCreateFormData(product);
    const response = await apiService.post<IProduct>(
      "products",
      fd,
      token,
      true
    );
    return (response.data ?? response) as unknown as IProduct;
  },
  async update(
    id: string,
    product: Partial<IProduct>,
    token?: string
  ): Promise<IProduct> {
    const body = toUpdateBody(product);
    const response = await apiService.put<IProduct>(
      `products/${id}`,
      body,
      token
    );
    return response.data as IProduct;
  },
  async updateProductImage(
    id: string,
    image: File,
    token?: string
  ): Promise<IProduct> {
    const fd = new FormData();
    fd.append("image", image);
    const response = await apiService.put<IProduct>(
      `products/${id}/image`,
      fd,
      token,
      true
    );
    return response.data as IProduct;
  },
  async removeProductImage(id: string, token?: string): Promise<IProduct> {
    const response = await apiService.delete<IProduct>(
      `products/${id}/image`,
      token
    );
    return response.data as IProduct;
  },
};
