export interface ICountry {
  id?: string;
  name: string;
  acronymIso: string;
  bacenCode?: string;
}

export interface IState {
  id?: string;
  name: string;
  acronym: string;
  ibgeCode: string;
  countryId: string;
  country: ICountry | null;
}

export interface ICity {
  id?: string;
  name: string;
  ibgeCode: string;
  stateId: string;
  state: IState | null;
}
