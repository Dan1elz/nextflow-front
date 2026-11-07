import { useCallback, type BaseSyntheticEvent } from "react";
import type {
  FieldValues,
  Path,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { useConfirmWarning } from "@/hooks/use-confirm-warning";
import { ApiError } from "@/services/api.service";
import { handleError } from "@/utils/toast.helpers";

/**
 * Liga um formulário (React Hook Form) ao contrato de erro da API (`contracts/README.md`):
 * - 422 com `fieldErrors`: marca cada campo do formulário com `setError` (chave em camelCase, igual ao campo);
 *   o toast só aparece quando nenhum campo casou;
 * - 422 com `fieldErrors.confirm`: abre o aviso (`ConfirmWarningDialog`) e, se o usuário confirmar, reenvia com
 *   `confirmWarnings: true` (RN-VD13);
 * - qualquer outra falha (400, 404, 409, 500): toast com a `message`.
 *
 * `submit(action)` devolve `true` quando a ação terminou sem erro.
 * `handleSubmit(onValid)` limpa os erros do servidor antes de validar: o RHF guarda o erro de `setError` num campo sem
 * regra (raiz de field array, como `payments`) e, enquanto ele existe, nunca mais chama o `onValid`.
 */
export function useApiForm<TValues extends FieldValues>(
  form: UseFormReturn<TValues>
) {
  const { askConfirmation, confirmWarning } = useConfirmWarning();

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

  const handleSubmit = useCallback(
    (onValid: SubmitHandler<TValues>) => (event?: BaseSyntheticEvent) => {
      form.clearErrors();
      return form.handleSubmit(onValid)(event);
    },
    [form]
  );

  return { submit, handleSubmit, confirmWarning };
}
