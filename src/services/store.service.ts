import { BaseService } from "./base.service";
import type {
  StoreRequestDto,
  StoreResponseDto,
  UpdateStoreRequestDto,
} from "@/interfaces/store.interface";

export const storeService = new BaseService<
  StoreResponseDto,
  StoreRequestDto | UpdateStoreRequestDto
>("stores");
