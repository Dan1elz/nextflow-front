import { BaseService } from "./base.service";
import type {
  LocationRequestDto,
  LocationResponseDto,
  UpdateLocationRequestDto,
} from "@/interfaces/store.interface";

export const locationService = new BaseService<
  LocationResponseDto,
  LocationRequestDto | UpdateLocationRequestDto
>("stock-locations");
