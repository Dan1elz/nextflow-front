import { useState, useCallback, type ReactNode } from "react";

import type {
  IUser,
  ICreateUser,
  IUpdateUser,
  IRecoverPasswordRequest,
  IResetPasswordRequest,
} from "@/interfaces/user.interface";
import { userService } from "@/services/user.service";
import { UsersContext } from "@/contexts/users.context";
import type { IPaginationInfo, IIndexParams } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const { token } = useAuth();

  const searchUsers = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;

      const response = await userService.getAll(query, token ?? undefined);
      setUsers(response.data || []);

      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.totalItems / perPage) || 1,
        total: response.totalItems,
        perPage,
      });
    },
    [token]
  );

  const selectUser = useCallback(
    async (id: string): Promise<void> => {
      const data = await userService.getById(id, token ?? undefined);
      setSelectedUser(data);
    },
    [token]
  );

  const createUser = useCallback(
    async (user: ICreateUser): Promise<IUser> => {
      const data = await userService.create(user, token ?? undefined);
      return data;
    },
    [token]
  );

  const updateUser = useCallback(
    async (id: string, user: IUpdateUser): Promise<IUser> => {
      const data = await userService.update(id, user, token ?? undefined);
      return data;
    },
    [token]
  );

  const deleteUser = useCallback(
    async (id: string): Promise<void> => {
      await userService.delete(id, token ?? undefined);
    },
    [token]
  );

  const recoverPassword = useCallback(
    async (data: IRecoverPasswordRequest): Promise<void> => {
      await userService.recoverPassword(data);
    },
    []
  );

  const resetPassword = useCallback(
    async (data: IResetPasswordRequest): Promise<void> => {
      await userService.resetPassword(data);
    },
    []
  );

  return (
    <UsersContext.Provider
      value={{
        users,
        pagination,
        selectedUser,
        searchUsers,
        selectUser,
        createUser,
        updateUser,
        deleteUser,
        recoverPassword,
        resetPassword,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}
