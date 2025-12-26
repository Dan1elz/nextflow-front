export interface IApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface IApiResponseError {
  status: number;
  message: string;
  error: {
    [key: string]: string[];
  };
}

export interface IApiResponseTable<T> {
  totalItems: number;
  data: T[];
}

export interface IOption {
  value: string;
  label: string;
}

export interface IListIdsGuid {
  ids: string[];
}

export interface IPagination {
  offset: number;
  limit: number;
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
}

export interface IBaseService<T> {
  delete: (id: string, token?: string) => Promise<[]>;
  getAll: (
    params?: IIndexParams,
    token?: string
  ) => Promise<IApiResponseTable<T>>;
  getById: (id: string, token?: string) => Promise<T>;
  create: (data: T, token?: string) => Promise<T>;
  update: (id: string, data: T, token?: string) => Promise<T>;
}
