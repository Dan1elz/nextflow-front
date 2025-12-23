import { toast } from "sonner";
import { ApiError } from "@/services/api.service";

export function handleError(
  error: unknown,
  fallbackMessage: string = "Erro desconhecido"
): void {
  if (error instanceof ApiError) {
    let description = "";

    if (Array.isArray(error.errors)) {
      description = error.errors.join(", ");
    } else if (typeof error.errors === "object" && error.errors !== null) {
      const messages = Object.entries(error.errors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
        .join("\n");
      description = messages;
    }

    toast.error(error.message, { description });
  } else if (error instanceof Error) {
    if (error.cause) console.log(error.cause);
    toast.error(error.message);
  } else {
    toast.error(fallbackMessage);
  }
}

export function handleSuccess(message: string): void {
  toast.success(message);
}

export function handleWarning(message: string): void {
  toast.warning(message);
}

export function handleInfo(message: string): void {
  toast(message);
}
