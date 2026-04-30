/**
 * Gera um UUID v4.
 * Usa `crypto.randomUUID()` quando disponível (HTTPS/localhost).
 * Em contextos inseguros (HTTP), faz fallback com `crypto.getRandomValues()`.
 */
export function generateUUID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback para contextos inseguros (HTTP em produção)
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
    ).toString(16)
  );
}
