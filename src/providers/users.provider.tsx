import { useState, useCallback, type ReactNode } from "react";

import type {
  UpdateUserRequestDto,
  UserListItemDto,
  UserOption,
  UserRequestDto,
  UserResponseDto,
} from "@/interfaces/user.interface";
import { userService } from "@/services/user.service";
import { UsersContext } from "@/contexts/users.context";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(
    null
  );
  const { token } = useAuth();

  const searchUsers = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await userService.getAll(query, token ?? undefined);
      setUsers(response.items || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [token]
  );

  const selectUser = useCallback(
    async (id: string): Promise<void> => {
      setSelectedUser(await userService.getById(id, token ?? undefined));
    },
    [token]
  );

  const searchUsersForOptions = useCallback(
    async (query?: IIndexParams) => {
      const response = await userService.getAll(query, token ?? undefined);
      return { data: response.items || [], totalItems: response.total };
    },
    [token]
  );

  const getUserOption = useCallback(
    async (id: string): Promise<UserOption> => {
      const user = await userService.getById(id, token ?? undefined);
      return { id: user.id, fullName: `${user.name} ${user.lastName}` };
    },
    [token]
  );

  const createUser = useCallback(
    (dto: UserRequestDto) => userService.create(dto, token ?? undefined),
    [token]
  );

  const updateUser = useCallback(
    (id: string, dto: UpdateUserRequestDto) =>
      userService.update(id, dto, token ?? undefined),
    [token]
  );

  const deleteUser = useCallback(
    (id: string) => userService.delete(id, token ?? undefined),
    [token]
  );

  const reactivateUser = useCallback(
    (id: string) => userService.reactivate(id, token ?? undefined),
    [token]
  );

  return (
    <UsersContext.Provider
      value={{
        users,
        pagination,
        selectedUser,
        searchUsers,
        searchUsersForOptions,
        getUserOption,
        selectUser,
        createUser,
        updateUser,
        deleteUser,
        reactivateUser,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}
