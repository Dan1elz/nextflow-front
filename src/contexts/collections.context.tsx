import { createContext } from "react";

import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";
import type {
  CollectionRequestDto,
  CollectionResponseDto,
} from "@/interfaces/collection.interface";

export type CollectionsContextType = {
  collections: CollectionResponseDto[];
  pagination: IPaginationInfo | null;
  searchCollections: (query?: IIndexParams) => Promise<void>;
  createCollection: (dto: CollectionRequestDto) => Promise<void>;
  updateCollection: (id: string, dto: CollectionRequestDto) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  reactivateCollection: (id: string) => Promise<void>;
};

export const CollectionsContext = createContext<CollectionsContextType | null>(
  null
);
