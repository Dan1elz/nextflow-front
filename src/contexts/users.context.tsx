import { createContext } from "react";

import type {
  UpdateUserRequestDto,
  UserListItemDto,
  UserOption,
  UserRequestDto,
  UserResponseDto,
} from "@/interfaces/user.interface";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";

export type UsersContextType = {
  users: UserListItemDto[];
  selectedUser: UserResponseDto | null;
  pagination: IPaginationInfo | null;
  searchUsers: (query?: IIndexParams) => Promise<void>;
  searchUsersForOptions: (
    query?: IIndexParams
  ) => Promise<{ data: UserOption[]; totalItems: number }>;
  getUserOption: (id: string) => Promise<UserOption>;
  selectUser: (id: string) => Promise<void>;
  createUser: (dto: UserRequestDto) => Promise<UserResponseDto>;
  updateUser: (
    id: string,
    dto: UpdateUserRequestDto
  ) => Promise<UserResponseDto>;
  deleteUser: (id: string) => Promise<void>;
  reactivateUser: (id: string) => Promise<void>;
};

export const UsersContext = createContext<UsersContextType | null>(null);
