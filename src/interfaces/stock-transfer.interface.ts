/** `StockTransferRequestDto` (RN-CE62). */
export interface StockTransferRequestDto {
  fromLocationId: string;
  toLocationId: string;
  note?: string | null;
  items: { variantId: string; quantity: number }[];
}

/** `StockTransferDto`. */
export interface StockTransferDto {
  id: string;
  number: number;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  note: string | null;
  forecastRecommendationId: string | null;
  createdAt: string;
  items: {
    variantId: string;
    productName: string;
    sku: string;
    quantity: number;
  }[];
}
