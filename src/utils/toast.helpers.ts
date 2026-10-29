import { toast, type ExternalToast } from "sonner";
import { ApiError } from "@/services/api.service";

/**
 * Mostra a falha no toast. Para `ApiError`, usa a `message` do `ResultDto`; erros por campo devem ser
 * marcados no formulário antes (`useApiForm`), e só chegam aqui quando nenhum campo casou.
 */
export function handleError(
  error: unknown,
  fallbackMessage: string = "Erro desconhecido"
): void {
  if (error instanceof ApiError) {
    const description =
      error.errors.length > 1 ? error.errors.join("\n") : undefined;
    toast.error(
      error.errors.length > 1
        ? "Não foi possível concluir a operação."
        : error.message,
      {
        description,
      }
    );
  } else if (error instanceof Error) {
    toast.error(error.message || fallbackMessage);
  } else {
    toast.error(fallbackMessage);
  }
}

export function handleSuccess(message: string, options?: ExternalToast): void {
  toast.success(message, options);
}

export function handleWarning(message: string): void {
  toast.warning(message);
}

export function handleInfo(message: string): void {
  toast(message);
}
