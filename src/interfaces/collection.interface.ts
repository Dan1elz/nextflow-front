export interface CollectionRequestDto {
  name: string;
  startsOn?: string | null;
  endsOn?: string | null;
}

/** `productCount` fica zero até a F1.3. */
export interface CollectionResponseDto {
  id: string;
  name: string;
  startsOn?: string | null;
  endsOn?: string | null;
  productCount: number;
  isActive: boolean;
}
