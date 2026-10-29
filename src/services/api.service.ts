import type { QueryParams, ResultDto } from "@/interfaces/api.interface";
import { API_URL } from "@/configs/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/** Chave de `fieldErrors` com o aviso que pede confirmação (RN-VD13). */
export const CONFIRM_FIELD = "confirm";

const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  401: "Sessão expirada ou não autenticada.",
  403: "Você não tem permissão para executar esta ação.",
  404: "Registro não encontrado.",
  409: "Este registro foi alterado por outra pessoa. Recarregue e tente novamente.",
  429: "Muitas tentativas. Aguarde um minuto e tente novamente.",
};

/**
 * Falha vinda da API no formato `ResultDto`.
 * - 422 com `fieldErrors`: o formulário marca cada campo (`applyApiFieldErrors`).
 * - 422 com `fieldErrors.confirm`: o formulário pede confirmação e reenvia com `confirmWarnings: true`.
 * - 409: conflito de versão; o formulário oferece recarregar.
 */
export class ApiError extends Error {
  status: number;
  errors: string[];
  fieldErrors: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    errors: string[] = [],
    fieldErrors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.fieldErrors = fieldErrors;
  }

  static fromResult(
    status: number,
    result: Partial<ResultDto> | null | undefined
  ): ApiError {
    const errors = result?.errors ?? [];
    const message =
      result?.message ||
      errors.join(" | ") ||
      STATUS_FALLBACK_MESSAGES[status] ||
      "Erro na requisição.";
    return new ApiError(
      result?.errorCode ?? status,
      message,
      errors,
      result?.fieldErrors ?? {}
    );
  }

  /** Mensagem do aviso que pede confirmação, quando a API devolveu `fieldErrors.confirm`. */
  get confirmMessage(): string | undefined {
    return this.fieldErrors[CONFIRM_FIELD]?.[0];
  }

  get isConfirmation(): boolean {
    return this.status === 422 && this.confirmMessage !== undefined;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  getFieldErrors(field: string): string[] {
    return this.fieldErrors[field] ?? [];
  }

  hasFieldError(field: string): boolean {
    return this.getFieldErrors(field).length > 0;
  }

  getErrorFields(): string[] {
    return Object.keys(this.fieldErrors).filter(
      (field) => field !== CONFIRM_FIELD
    );
  }
}

let unauthorizedHandler: (() => void) | undefined;

/** Registrado pelo AuthProvider: um 401 encerra a sessão (token vencido ou usuário inativado). */
export function onUnauthorized(handler: (() => void) | undefined) {
  unauthorizedHandler = handler;
}

function getHeaders(
  token?: string,
  isFormData = false
): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== ""
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()}`;
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || `${API_URL}/api/`;
  }

  private async request<T>(
    method: HttpMethod,
    uri: string,
    body?: unknown,
    token?: string,
    params?: QueryParams,
    isFormData?: boolean
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${uri}${buildQuery(params)}`, {
        method,
        headers: getHeaders(token, isFormData),
        body: isFormData
          ? (body as FormData)
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
      });
    } catch {
      throw new ApiError(
        0,
        "Não foi possível falar com o servidor. Verifique a conexão."
      );
    }

    const text = await response.text();
    let content: unknown = undefined;
    if (text) {
      try {
        content = JSON.parse(text);
      } catch {
        if (!response.ok) throw ApiError.fromResult(response.status, null);
      }
    }

    if (!response.ok) {
      if (response.status === 401 && token) unauthorizedHandler?.();
      throw ApiError.fromResult(response.status, content as Partial<ResultDto>);
    }

    return content as T;
  }

  public get<T>(uri: string, params?: QueryParams, token?: string) {
    return this.request<T>("GET", uri, undefined, token, params);
  }

  public post<T>(
    uri: string,
    body: unknown,
    token?: string,
    isFormData?: boolean
  ) {
    return this.request<T>("POST", uri, body, token, undefined, isFormData);
  }

  public put<T>(
    uri: string,
    body: unknown,
    token?: string,
    isFormData?: boolean
  ) {
    return this.request<T>("PUT", uri, body, token, undefined, isFormData);
  }

  public patch<T>(uri: string, body: unknown, token?: string) {
    return this.request<T>("PATCH", uri, body, token);
  }

  public delete<T>(uri: string, token?: string, body?: unknown) {
    return this.request<T>("DELETE", uri, body, token);
  }
}
