export interface CollectionRequestDto {
  name: string;
  startsOn?: string | null;
  endsOn?: string | null;
}

/** `productCount` conta os produtos ativos da coleção (RN-CE53). */
export interface CollectionResponseDto {
  id: string;
  name: string;
  startsOn?: string | null;
  endsOn?: string | null;
  productCount: number;
  isActive: boolean;
}
