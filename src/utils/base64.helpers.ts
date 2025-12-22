/**
 * Converte uma string ou arquivo para Base64
 * @param data - String ou File para converter
 * @returns Promise<string> - String em Base64
 */
export async function convertToBase64(data: string | File): Promise<string> {
  if (typeof data === "string") {
    // Usa TextEncoder para suportar caracteres Unicode corretamente
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const binaryString = Array.from(bytes, (byte) =>
      String.fromCharCode(byte)
    ).join("");
    return btoa(binaryString);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(data);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:mime/type;base64,"
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Erro ao converter arquivo para Base64"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Reverte uma string Base64 para string original
 * @param base64 - String em Base64
 * @returns string - String original
 */
export function revertFromBase64(base64: string): string {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(
      Array.from(binaryString, (char) => char.charCodeAt(0))
    );
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (error) {
    throw new Error(
      `Erro ao decodificar Base64: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Converte Base64 para Blob (útil para download de arquivos)
 * @param base64 - String em Base64
 * @param mimeType - Tipo MIME do arquivo (ex: "image/png")
 * @returns Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(
      Array.from(binaryString, (char) => char.charCodeAt(0))
    );
    return new Blob([bytes], { type: mimeType });
  } catch (error) {
    throw new Error(
      `Erro ao converter Base64 para Blob: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
