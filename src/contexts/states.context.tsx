import { createContext } from "react";

import type { IState } from "@/interfaces/locations.interface";
import type { IIndexParams, IPaginationInfo } from "@/interfaces/api.interface";

export type StatesContextType = {
  states: IState[];
  selectedState: IState | null;
  pagination: IPaginationInfo | null;
  searchStates: (query?: IIndexParams) => Promise<void>;
  selectState: (id: string) => Promise<void>;
  createState: (state: IState) => Promise<IState>;
  updateState: (id: string, state: IState) => Promise<IState>;
  deleteState: (id: string) => Promise<void>;
};

export const StatesContext = createContext<StatesContextType | null>(null);
