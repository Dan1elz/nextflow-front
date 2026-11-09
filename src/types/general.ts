export interface IBreadcrumb {
  name: string;
  path: string;
  isLast: boolean;
  /** Segmento sem tela própria: mostrado sem link. */
  textOnly?: boolean;
}

export { TUnitType, UNIT_TYPE_LABELS } from "./enums";
