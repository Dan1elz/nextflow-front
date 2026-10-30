import { BaseService } from "./base.service";
import type {
  UpdateUserRequestDto,
  UserListItemDto,
  UserRequestDto,
  UserResponseDto,
} from "@/interfaces/user.interface";

export const userService = new BaseService<
  UserResponseDto,
  UserRequestDto | UpdateUserRequestDto,
  UserListItemDto
>("users");
