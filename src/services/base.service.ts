import type {
  IBaseService,
  IIndexParams,
  Option,
  PaginationDto,
  QueryParams,
} from "@/interfaces/api.interface";
import { ApiService } from "./api.service";

/**
 * CRUD padrão de um recurso da API nova: listagem `{ items, total }` com `offset`/`limit`/`filters`/`sort`/`order`,
 * inativar por `DELETE /{id}` e reativar por `PATCH /{id}/reactivate`.
 */
export class BaseService<
  T,
  TRequest = Partial<T>,
  TListItem = T,
> implements IBaseService<T, TRequest, TListItem> {
  protected endpoint: string;
  protected apiService: ApiService;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.apiService = new ApiService();
  }

  static toQuery(params?: IIndexParams): QueryParams {
    const perPage = params?.perPage ?? 10;
    const page = params?.page ?? 1;
    return {
      offset: (page - 1) * perPage,
      limit: perPage,
      filters:
        params?.filters && Object.keys(params.filters).length > 0
          ? JSON.stringify(params.filters)
          : undefined,
      sort: params?.sort,
      order: params?.order,
    };
  }

  getAll(
    params?: IIndexParams,
    token?: string
  ): Promise<PaginationDto<TListItem>> {
    return this.apiService.get<PaginationDto<TListItem>>(
      this.endpoint,
      BaseService.toQuery(params),
      token
    );
  }

  getById(id: string, token?: string): Promise<T> {
    return this.apiService.get<T>(`${this.endpoint}/${id}`, undefined, token);
  }

  create(data: TRequest, token?: string): Promise<T> {
    return this.apiService.post<T>(this.endpoint, data, token);
  }

  update(id: string, data: TRequest, token?: string): Promise<T> {
    return this.apiService.put<T>(`${this.endpoint}/${id}`, data, token);
  }

  delete(id: string, token?: string): Promise<void> {
    return this.apiService.delete<void>(`${this.endpoint}/${id}`, token);
  }

  reactivate(id: string, token?: string): Promise<void> {
    return this.apiService.patch<void>(
      `${this.endpoint}/${id}/reactivate`,
      {},
      token
    );
  }

  options(
    search?: string,
    token?: string,
    extra?: QueryParams
  ): Promise<Option[]> {
    return this.apiService.get<Option[]>(
      `${this.endpoint}/options`,
      { search, ...extra },
      token
    );
  }
}
