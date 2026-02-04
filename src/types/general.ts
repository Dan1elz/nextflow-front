export interface IBreadcrumb {
  name: string;
  path: string;
  isLast: boolean;
}

export const TUnitType = {
  UN: 0,
  KG: 1,
  LT: 2,
  CX: 3,
} as const;

export type TUnitType = (typeof TUnitType)[keyof typeof TUnitType];
