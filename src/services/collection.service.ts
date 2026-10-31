import { BaseService } from "./base.service";
import type {
  CollectionRequestDto,
  CollectionResponseDto,
} from "@/interfaces/collection.interface";

export const collectionService = new BaseService<
  CollectionResponseDto,
  CollectionRequestDto
>("collections");
