import { useCallback, useState, type ReactNode } from "react";

import { CollectionsContext } from "@/contexts/collections.context";
import { useAuth } from "@/hooks/use-auth";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  CollectionRequestDto,
  CollectionResponseDto,
} from "@/interfaces/collection.interface";
import { collectionService } from "@/services/collection.service";

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<CollectionResponseDto[]>([]);
  const [pagination, setPagination] = useState<IPaginationInfo | null>(null);
  const { token } = useAuth();
  const auth = token ?? undefined;

  const searchCollections = useCallback(
    async (query?: IIndexParams) => {
      const page = query?.page ?? 1;
      const perPage = query?.perPage ?? 10;
      const response = await collectionService.getAll(query, auth);
      setCollections(response.items || []);
      setPagination({
        currentPage: page,
        lastPage: Math.ceil(response.total / perPage) || 1,
        total: response.total,
        perPage,
      });
    },
    [auth]
  );

  const createCollection = useCallback(
    async (dto: CollectionRequestDto) => {
      await collectionService.create(dto, auth);
    },
    [auth]
  );

  const updateCollection = useCallback(
    async (id: string, dto: CollectionRequestDto) => {
      await collectionService.update(id, dto, auth);
    },
    [auth]
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      await collectionService.delete(id, auth);
    },
    [auth]
  );

  const reactivateCollection = useCallback(
    async (id: string) => {
      await collectionService.reactivate(id, auth);
    },
    [auth]
  );

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        pagination,
        searchCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        reactivateCollection,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}
