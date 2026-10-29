import { useCallback, useRef, useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiError } from "@/services/api.service";
import { handleError } from "@/utils/toast.helpers";

export interface ConfirmWarningState {
  open: boolean;
  message: string;
  confirm: () => void;
  cancel: () => void;
}

/**
 * Liga um formulário (React Hook Form) ao contrato de erro da API (`contracts/README.md`):
 * - 422 com `fieldErrors`: marca cada campo do formulário com `setError` (chave em camelCase, igual ao campo);
 *   o toast só aparece quando nenhum campo casou;
 * - 422 com `fieldErrors.confirm`: abre o aviso (`ConfirmWarningDialog`) e, se o usuário confirmar, reenvia com
 *   `confirmWarnings: true` (RN-VD13);
 * - qualquer outra falha (400, 404, 409, 500): toast com a `message`.
 *
 * `submit(action)` devolve `true` quando a ação terminou sem erro.
 */
export function useApiForm<TValues extends FieldValues>(
  form: UseFormReturn<TValues>
) {
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });
  const resolver = useRef<((confirmed: boolean) => void) | undefined>(
    undefined
  );

  const askConfirmation = useCallback((message: string) => {
    setConfirmState({ open: true, message });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const closeConfirmation = useCallback((confirmed: boolean) => {
    setConfirmState((state) => ({ ...state, open: false }));
    resolver.current?.(confirmed);
    resolver.current = undefined;
  }, []);

  const applyFieldErrors = useCallback(
    (error: ApiError): boolean => {
      const knownFields = Object.keys(form.getValues());
      let applied = false;
      for (const field of error.getErrorFields()) {
        const root = field.split(/[.[]/)[0];
        if (!knownFields.includes(root)) continue;
        form.setError(field as Path<TValues>, {
          type: "server",
          message: error.getFieldErrors(field).join(" "),
        });
        applied = true;
      }
      return applied;
    },
    [form]
  );

  const submit = useCallback(
    async (
      action: (confirmWarnings: boolean) => Promise<void>
    ): Promise<boolean> => {
      let confirmWarnings = false;
      for (;;) {
        try {
          await action(confirmWarnings);
          return true;
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.isConfirmation &&
            !confirmWarnings
          ) {
            if (!(await askConfirmation(error.confirmMessage ?? "")))
              return false;
            confirmWarnings = true;
            continue;
          }
          if (
            error instanceof ApiError &&
            error.status === 422 &&
            applyFieldErrors(error)
          )
            return false;
          handleError(error);
          return false;
        }
      }
    },
    [applyFieldErrors, askConfirmation]
  );

  const confirmWarning: ConfirmWarningState = {
    open: confirmState.open,
    message: confirmState.message,
    confirm: () => closeConfirmation(true),
    cancel: () => closeConfirmation(false),
  };

  return { submit, confirmWarning };
}
