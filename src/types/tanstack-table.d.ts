import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // TData e TValue fazem parte da assinatura original da interface.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Some do card da listagem no celular (a coluna continua na tabela do desktop). */
    hideOnMobile?: boolean;
    /** Rótulo do campo no card do celular quando o `header` não é texto (ex.: componente alinhado à direita). */
    label?: string;
  }
}
