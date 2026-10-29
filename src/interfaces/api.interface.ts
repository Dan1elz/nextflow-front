/**
 * Envelope da API (padrão atrena, ADR 0010 — `nextflow-docs/docs/architecture/contracts/README.md`).
 * Sucesso: o corpo é o próprio DTO. Listagem: `PaginationDto<T>`. Falha: `ResultDto`.
 */
export interface PaginationDto<T> {
  items: T[];
  total: number;
}

export interface ResultDto {
  isSuccess: false;
  errors: string[];
  fieldErrors?: Record<string, string[]> | null;
  errorCode: number;
  message: string;
  data?: unknown;
}

/** Combo simples (`GET /<recurso>/options?search=`). */
export interface Option {
  value: string;
  label: string;
}

export interface IOption {
  value?: string;
  label?: string;
  [key: string]: unknown;
}

export interface IListIdsGuid {
  ids: string[];
}

export interface IPaginationInfo {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

export interface IIndexParams {
  filters?: Record<string, string>;
  page?: number;
  perPage?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface IBaseService<T, TRequest = Partial<T>, TListItem = T> {
  delete: (id: string, token?: string) => Promise<void>;
  reactivate: (id: string, token?: string) => Promise<void>;
  getAll: (
    params?: IIndexParams,
    token?: string
  ) => Promise<PaginationDto<TListItem>>;
  getById: (id: string, token?: string) => Promise<T>;
  create: (data: TRequest, token?: string) => Promise<T>;
  update: (id: string, data: TRequest, token?: string) => Promise<T>;
}
