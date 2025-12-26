import type {
  IApiResponse,
  IApiResponseError,
} from "@/interfaces/api.interface";
import { API_URL } from "@/configs/api";

const url = API_URL;

function getHeaders(
  token?: string,
  isFormData = false
): Record<string, string> {
  let newHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (!isFormData) {
    newHeaders = {
      ...newHeaders,
      "Content-Type": "application/json",
    };
  }

  if (token) {
    newHeaders = {
      ...newHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  return newHeaders;
}

export class ApiError extends Error {
  status: number;
  errors: {
    [key: string]: string[];
  };

  constructor(errorResponse: IApiResponseError) {
    super(errorResponse.Message);
    this.name = "ApiError";
    this.status = errorResponse.Status;
    this.errors = errorResponse.Errors || {};
  }

  getFieldErrors(field: string): string[] {
    return this.errors[field] || [];
  }

  hasFieldError(field: string): boolean {
    return field in this.errors && this.errors[field].length > 0;
  }

  getAllErrors(): string[] {
    return Object.values(this.errors).flat();
  }

  getErrorFields(): string[] {
    return Object.keys(this.errors);
  }
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || `${url}/api/`;
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    uri: string,
    body?: object,
    token?: string,
    params?: Record<string, string>,
    isFormData?: boolean
  ): Promise<IApiResponse<T>> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const fullUrl = `${this.baseUrl}${uri}${query}`;

    const response = await fetch(fullUrl, {
      method,
      headers: getHeaders(token, isFormData),
      body: isFormData
        ? (body as FormData)
        : body
          ? JSON.stringify(body)
          : undefined,
    });

    const content: IApiResponse<T> | IApiResponseError = await response.json();

    if (!response.ok || "Errors" in content) {
      const errorContent = content as IApiResponseError;
      throw new ApiError(errorContent);
    }

    return content as IApiResponse<T>;
  }

  public post<T>(
    uri: string,
    body: object,
    token?: string,
    isFormData?: boolean
  ) {
    return this.request<T>("POST", uri, body, token, undefined, isFormData);
  }

  public get<T>(uri: string, params?: Record<string, string>, token?: string) {
    return this.request<T>("GET", uri, undefined, token, params);
  }

  public put<T>(uri: string, body: object, token?: string) {
    return this.request<T>("PUT", uri, body, token);
  }

  public patch<T>(uri: string, body: object, token?: string) {
    return this.request<T>("PATCH", uri, body, token);
  }

  public delete<T>(uri: string, token?: string) {
    return this.request<T>("DELETE", uri, undefined, token);
  }
}
