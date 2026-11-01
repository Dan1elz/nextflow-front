import { useCallback, useRef, useState } from "react";

export interface ConfirmWarningState {
  open: boolean;
  message: string;
  confirm: () => void;
  cancel: () => void;
}

/** Estado do aviso que a API pede para confirmar (`fieldErrors.confirm`, RN-VD13), usado com `ConfirmWarningDialog`. */
export function useConfirmWarning() {
  const [state, setState] = useState({ open: false, message: "" });
  const resolver = useRef<((confirmed: boolean) => void) | undefined>(
    undefined
  );

  const askConfirmation = useCallback((message: string) => {
    setState({ open: true, message });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    setState((current) => ({ ...current, open: false }));
    resolver.current?.(confirmed);
    resolver.current = undefined;
  }, []);

  const confirmWarning: ConfirmWarningState = {
    open: state.open,
    message: state.message,
    confirm: () => close(true),
    cancel: () => close(false),
  };

  return { askConfirmation, confirmWarning };
}
