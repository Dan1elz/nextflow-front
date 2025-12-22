/**
 * Remove todos os caracteres não numéricos de uma string
 * @param value - String a ser formatada
 * @returns string - Apenas números
 */
export function formatOnlyNumbers(value: string | number): string {
  if (typeof value === "number") {
    return value.toString();
  }
  return value.replace(/\D/g, "");
}

/**
 * Formata CPF ou CNPJ
 * @param value - CPF ou CNPJ sem formatação
 * @returns string - CPF ou CNPJ formatado (000.000.000-00 ou 00.000.000/0000-00)
 */
export function formatCpfCnpj(value: string | number): string {
  const numbers = formatOnlyNumbers(value);

  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
}

/**
 * Formata CEP
 * @param value - CEP sem formatação
 * @returns string - CEP formatado (00000-000)
 */
export function formatCep(value: string | number): string {
  const numbers = formatOnlyNumbers(value);
  return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
}

/**
 * Formata data apenas (DD/MM/YYYY)
 * @param value - Data (Date, string ISO ou string formatada)
 * @returns string - Data formatada (DD/MM/YYYY)
 */
export function formatDateOnly(value: Date | string): string {
  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    return "";
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formata telefone
 * @param value - Telefone sem formatação
 * @returns string - Telefone formatado ((00) 00000-0000 ou (00) 0000-0000)
 */
export function formatPhone(value: string | number): string {
  const numbers = formatOnlyNumbers(value);

  if (numbers.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    // Celular: (00) 00000-0000
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})/, "$1-$2");
  }
}

/**
 * Formata porcentagem
 * @param value - Valor numérico (0 a 1 ou 0 a 100)
 * @param isDecimal - Se true, assume que o valor está entre 0 e 1. Se false, assume 0 a 100
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns string - Porcentagem formatada (00,00%)
 */
export function formatPercentage(
  value: number,
  isDecimal = false,
  decimals = 2
): string {
  let percentage = value;

  if (isDecimal) {
    percentage = value * 100;
  }

  return `${percentage.toFixed(decimals).replace(".", ",")}%`;
}

/**
 * Formata valor monetário
 * @param value - Valor numérico
 * @param currency - Código da moeda (ISO 4217). Padrão: "BRL" (Real Brasileiro)
 * @param decimals - Número de casas decimais (padrão: 2)
 * @param locale - Locale para formatação. Padrão: "pt-BR"
 * @returns string - Valor formatado (ex: R$ 0.000,00, US$ 0,000.00)
 *
 * @example
 * formatCurrency(1000) // "R$ 1.000,00"
 * formatCurrency(1000, "USD") // "US$ 1,000.00"
 * formatCurrency(1000, "EUR", 2, "pt-PT") // "1 000,00 €"
 */
export function formatCurrency(
  value: number,
  currency: string = "BRL",
  decimals: number = 2,
  locale: string = "pt-BR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata número com separadores de milhar
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 0)
 * @returns string - Número formatado (1.000,00)
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
