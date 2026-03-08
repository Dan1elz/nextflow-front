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
    body?: unknown,
    token?: string,
    params?: Record<string, string | number | boolean>,
    isFormData?: boolean
  ): Promise<IApiResponse<T>> {
    const query = params
      ? `?${new URLSearchParams(Object.entries(params) as [string, string][]).toString()}`
      : "";
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

    if (response.status === 204) {
      return {
        status: 204,
        message: "No Content",
        data: undefined as unknown as T,
      };
    }

    const text = await response.text();
    let content: IApiResponse<T> | IApiResponseError;

    if (!response.ok) {
      try {
        content = text ? JSON.parse(text) : ({} as IApiResponseError);
      } catch {
        throw new ApiError({
          Status: response.status,
          Message: "Erro ao processar resposta do servidor",
          Errors: null,
        });
      }

      if ("Status" in content && "Message" in content) {
        const errorContent = content as IApiResponseError;
        throw new ApiError(errorContent);
      }

      const unknownContent = content as unknown as Record<string, unknown>;
      throw new ApiError({
        Status: response.status,
        Message:
          (unknownContent.message as string) ||
          (unknownContent.Message as string) ||
          "Erro na requisição",
        Errors:
          (unknownContent.errors as IApiResponseError["Errors"]) ||
          (unknownContent.Errors as IApiResponseError["Errors"]) ||
          null,
      });
    }

    try {
      content = text ? JSON.parse(text) : ({} as IApiResponse<T>);
    } catch {
      return {
        status: response.status,
        message: "Success",
        data: undefined as unknown as T,
      };
    }

    if ("Errors" in content) {
      const errorContent = content as IApiResponseError;
      throw new ApiError(errorContent);
    }

    return content as IApiResponse<T>;
  }

  public post<T>(
    uri: string,
    body: unknown,
    token?: string,
    isFormData?: boolean
  ) {
    return this.request<T>("POST", uri, body, token, undefined, isFormData);
  }

  public get<T>(
    uri: string,
    params?: Record<string, string | number | boolean>,
    token?: string
  ) {
    return this.request<T>("GET", uri, undefined, token, params);
  }

  public put<T>(
    uri: string,
    body: object | FormData,
    token?: string,
    isFormData?: boolean
  ) {
    return this.request<T>("PUT", uri, body, token, undefined, isFormData);
  }

  public patch<T>(uri: string, body: object, token?: string) {
    return this.request<T>("PATCH", uri, body, token);
  }

  public delete<T>(uri: string, token?: string, body?: object) {
    return this.request<T>("DELETE", uri, body, token);
  }
}
