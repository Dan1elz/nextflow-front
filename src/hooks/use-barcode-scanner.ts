import { useEffect, useRef } from "react";

/** Intervalo máximo entre dois caracteres do leitor; uma pessoa digitando leva bem mais que isso. */
const MAX_GAP_MS = 50;
/** Código de barras ou SKU mais curto aceito como leitura. */
const MIN_LENGTH = 4;
/** Leitor configurado sem Enter: a leitura termina quando os caracteres param de chegar. */
const IDLE_MS = 80;

interface UseBarcodeScannerOptions {
  /** Liga e desliga a escuta (ex.: com um diálogo aberto). */
  enabled?: boolean;
}

/** Campo de texto onde o usuário digita: o leitor não intercepta (os caracteres já entraram nele). */
function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  return (
    target instanceof HTMLInputElement &&
    !["button", "checkbox", "radio", "submit", "reset"].includes(target.type)
  );
}

/**
 * Leitor de código de barras "teclado" (HID) fora de um campo de texto: o leitor manda os caracteres a poucos
 * milissegundos um do outro e termina com Enter (ou para). Uma sequência rápida assim, com o foco num botão ou na página,
 * vira uma leitura e chama `onScan`; o Enter dela não aciona o botão focado. Digitação humana (lenta) é ignorada, e o
 * que acontece dentro de um campo de texto fica com o campo.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  { enabled = true }: UseBarcodeScannerOptions = {}
) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;
    let buffer = "";
    let lastAt = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const reset = () => {
      buffer = "";
      clearTimeout(idleTimer);
    };

    const flush = () => {
      const code = buffer;
      reset();
      if (code.length >= MIN_LENGTH) onScanRef.current(code);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return reset();
      if (isEditable(event.target)) return reset();

      const now = performance.now();
      if (buffer && now - lastAt > MAX_GAP_MS) buffer = "";
      lastAt = now;

      if (event.key === "Enter") {
        if (buffer.length >= MIN_LENGTH) {
          // O Enter é do leitor: não clica no botão que estiver focado.
          event.preventDefault();
          event.stopPropagation();
          flush();
        } else {
          reset();
        }
        return;
      }

      if (event.key.length !== 1) return;
      buffer += event.key;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        // Sem Enter: só conta se chegou rápido o bastante para não ser alguém digitando (2+ caracteres).
        if (buffer.length >= MIN_LENGTH) flush();
        else reset();
      }, IDLE_MS);
    };

    // Captura: roda antes do botão focado tratar o Enter.
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      clearTimeout(idleTimer);
    };
  }, [enabled]);
}
