import { BaseService } from "./base.service";
import type {
  AddressRequestDto,
  AddressResponseDto,
  UpdateAddressRequestDto,
} from "@/interfaces/address.interface";

export const addressService = new BaseService<
  AddressResponseDto,
  AddressRequestDto | UpdateAddressRequestDto
>("addresses");
