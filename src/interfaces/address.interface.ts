import type { TOwnerType } from "@/types/enums";

export interface UpdateAddressRequestDto {
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  cityId: string;
  isMain: boolean;
}

export interface AddressRequestDto extends UpdateAddressRequestDto {
  ownerType: TOwnerType;
  ownerId: string;
}

export interface AddressResponseDto {
  id: string;
  ownerType: TOwnerType;
  ownerId: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  cityId: string;
  cityName: string;
  stateAbbreviation: string;
  isMain: boolean;
}
