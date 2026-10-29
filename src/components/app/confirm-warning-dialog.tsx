import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConfirmWarningState } from "@/hooks/use-api-form";

/** Aviso que a API pede para confirmar (`fieldErrors.confirm`, RN-VD13). Estado vem do `useApiForm`. */
export function ConfirmWarningDialog({
  state,
}: {
  state: ConfirmWarningState;
}) {
  return (
    <AlertDialog
      open={state.open}
      onOpenChange={(open) => !open && state.cancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar</AlertDialogTitle>
          <AlertDialogDescription>{state.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={state.cancel}>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={state.confirm}>
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
