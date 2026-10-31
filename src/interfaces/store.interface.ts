export interface StoreRequestDto {
  name: string;
}

export interface UpdateStoreRequestDto {
  name: string;
  defaultSaleLocationId: string;
  defaultReceiveLocationId: string;
}

export interface UpdateLocationRequestDto {
  name: string;
  isSellable: boolean;
}

export interface LocationRequestDto extends UpdateLocationRequestDto {
  storeId: string;
}

/** `hasStock` é falso até a F1.5, quando o saldo passa a existir. */
export interface LocationResponseDto {
  id: string;
  storeId: string;
  name: string;
  isSellable: boolean;
  isActive: boolean;
  hasStock: boolean;
}

export interface StoreResponseDto {
  id: string;
  name: string;
  isActive: boolean;
  defaultSaleLocationId?: string | null;
  defaultReceiveLocationId?: string | null;
  locations: LocationResponseDto[];
}

export interface LocationOptionDto {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  isSellable: boolean;
}
