import { useState, useCallback, type ReactNode } from "react";

import type {
  IUser,
  ICreateUser,
  IUpdateUser,
  IRecoverPasswordRequest,
  IResetPasswordRequest,
} from "@/interfaces/user.interface";
import { userService } from "@/services/user.service";
import { UserContext } from "@/contexts/user.context";
import type { IPagination } from "@/interfaces/api.interface";
import { useAuth } from "@/hooks/use-auth";

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const { token } = useAuth();

  const searchUsers = useCallback(
    async (query?: IPagination) => {
      const response = await userService.getAll(query, token ?? undefined);
      setUsers(response.data || []);
      if (query) {
        setPagination(query);
      }
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
    <UserContext.Provider
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
    </UserContext.Provider>
  );
}
