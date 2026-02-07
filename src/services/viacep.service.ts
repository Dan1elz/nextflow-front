export type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
};

export class ViaCepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ViaCepError";
  }
}

function normalizeCep(cep: string) {
  return cep.replace(/\D/g, "");
}

export const viaCepService = {
  async getByCep(cep: string): Promise<ViaCepResponse> {
    const normalized = normalizeCep(cep);
    if (normalized.length !== 8) {
      throw new ViaCepError("CEP inválido");
    }

    const response = await fetch(
      `https://viacep.com.br/ws/${normalized}/json/`
    );
    if (!response.ok) {
      throw new ViaCepError("Erro ao consultar CEP");
    }

    const data = (await response.json()) as ViaCepResponse;
    if (data.erro) {
      throw new ViaCepError("CEP não encontrado");
    }

    return data;
  },
};
