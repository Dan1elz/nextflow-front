import type {
  IApiResponseTable,
  IBaseService,
  IIndexParams,
} from "@/interfaces/api.interface";
import { ApiService } from "./api.service";

export class BaseService<T> implements IBaseService<T> {
  private endpoint: string;
  private apiService: ApiService;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.apiService = new ApiService();
  }

  async delete(id: string, token?: string): Promise<[]> {
    const response = await this.apiService.delete<[]>(
      `${this.endpoint}/${id}`,
      token
    );
    return response.data;
  }

  async getAll(
    params?: IIndexParams,
    token?: string
  ): Promise<IApiResponseTable<T>> {
    const query: Record<string, string> = {};

    if (params?.filters) {
      query.filters = JSON.stringify(params.filters);
    }

    if (params?.page) {
      query.page = params.page.toString();
    }

    if (params?.perPage) {
      query.perPage = params.perPage.toString();
    }

    const response = await this.apiService.get<IApiResponseTable<T>>(
      this.endpoint,
      query,
      token
    );

    return response.data;
  }

  async getById(id: string, token?: string): Promise<T> {
    const response = await this.apiService.get<T>(
      `${this.endpoint}/${id}`,
      undefined,
      token
    );
    return response.data;
  }

  async create(data: Partial<T>, token?: string): Promise<T> {
    const response = await this.apiService.post<T>(this.endpoint, data, token);
    return response.data;
  }

  async update(id: string, data: Partial<T>, token?: string): Promise<T> {
    const response = await this.apiService.put<T>(
      `${this.endpoint}/${id}`,
      data,
      token
    );
    return response.data;
  }
}
