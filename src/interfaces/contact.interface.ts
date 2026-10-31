import type { TContactType, TOwnerType } from "@/types/enums";

export interface UpdateContactRequestDto {
  type: TContactType;
  value: string;
  isMain: boolean;
}

export interface ContactRequestDto extends UpdateContactRequestDto {
  ownerType: TOwnerType;
  ownerId: string;
}

export interface ContactResponseDto {
  id: string;
  ownerType: TOwnerType;
  ownerId: string;
  type: TContactType;
  value: string;
  isMain: boolean;
}
