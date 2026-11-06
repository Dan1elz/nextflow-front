import type { TAbcClass } from "@/types/enums";

/** Linha do T13 (RN-CE29). `productCount` fica 0 até a análise (F3) classificar os produtos. */
export interface StockPolicyDto {
  id: string;
  abcClass: TAbcClass;
  targetCoverageDays: number;
  safetyDays: number;
  productCount: number;
}

export interface StockPolicyRequestDto {
  targetCoverageDays: number;
  safetyDays: number;
}
