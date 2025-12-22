/**
 * Valida CPF
 * @param cpf - CPF com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCpf(cpf: string | number): boolean {
  const numbers = cpf.toString().replace(/\D/g, "");

  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false; // Todos os dígitos iguais

  let sum = 0;
  let remainder: number;

  // Valida primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;

  sum = 0;
  // Valida segundo dígito verificador
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;

  return true;
}

/**
 * Valida CNPJ
 * @param cnpj - CNPJ com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCnpj(cnpj: string | number): boolean {
  const numbers = cnpj.toString().replace(/\D/g, "");

  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false; // Todos os dígitos iguais

  let length = numbers.length - 2;
  let digits = numbers.substring(0, length);
  const checkDigits = numbers.substring(length);
  let sum = 0;
  let pos = length - 7;

  // Valida primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(digits.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(checkDigits.charAt(0))) return false;

  length = length + 1;
  digits = numbers.substring(0, length);
  sum = 0;
  pos = length - 7;

  // Valida segundo dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(digits.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(checkDigits.charAt(1))) return false;

  return true;
}

/**
 * Valida CPF ou CNPJ
 * @param value - CPF ou CNPJ com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCpfCnpj(value: string | number): boolean {
  const numbers = value.toString().replace(/\D/g, "");
  return numbers.length === 11 ? validateCpf(value) : validateCnpj(value);
}

/**
 * Valida se a string contém apenas números
 * @param value - String a ser validada
 * @returns boolean - true se contém apenas números
 */
export function validateOnlyNumbers(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Valida email
 * @param email - Email a ser validado
 * @returns boolean - true se válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone (fixo ou celular)
 * @param phone - Telefone com ou sem formatação
 * @returns boolean - true se válido
 */
export function validatePhone(phone: string | number): boolean {
  const numbers = phone.toString().replace(/\D/g, "");
  // Telefone fixo: 10 dígitos | Celular: 11 dígitos
  return numbers.length === 10 || numbers.length === 11;
}

/**
 * Valida CEP
 * @param cep - CEP com ou sem formatação
 * @returns boolean - true se válido
 */
export function validateCep(cep: string | number): boolean {
  const numbers = cep.toString().replace(/\D/g, "");
  return numbers.length === 8;
}

/**
 * Valida se a string não está vazia
 * @param value - String a ser validada
 * @returns boolean - true se não está vazia
 */
export function validateNotEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Valida tamanho mínimo da string
 * @param value - String a ser validada
 * @param minLength - Tamanho mínimo
 * @returns boolean - true se atende ao tamanho mínimo
 */
export function validateMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Valida tamanho máximo da string
 * @param value - String a ser validada
 * @param maxLength - Tamanho máximo
 * @returns boolean - true se não excede o tamanho máximo
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Valida se o valor está dentro de um range
 * @param value - Valor numérico
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns boolean - true se está dentro do range
 */
export function validateRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * Valida se a senha atende aos critérios mínimos
 * @param password - Senha a ser validada
 * @param minLength - Tamanho mínimo (padrão: 6)
 * @param requireUppercase - Requer letra maiúscula (padrão: false)
 * @param requireLowercase - Requer letra minúscula (padrão: false)
 * @param requireNumber - Requer número (padrão: false)
 * @param requireSpecialChar - Requer caractere especial (padrão: false)
 * @returns object - { valid: boolean, errors: string[] }
 */
export function validatePassword(
  password: string,
  minLength = 6,
  requireUppercase = false,
  requireLowercase = false,
  requireNumber = false,
  requireSpecialChar = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`A senha deve ter no mínimo ${minLength} caracteres`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula");
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula");
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push("A senha deve conter pelo menos um número");
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("A senha deve conter pelo menos um caractere especial");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida URL
 * @param url - URL a ser validada
 * @returns boolean - true se válido
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida data
 * @param date - Data a ser validada (string ou Date)
 * @returns boolean - true se válido
 */
export function validateDate(date: string | Date): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  return !isNaN(dateObj.getTime());
}

/**
 * Valida se a data é futura
 * @param date - Data a ser validada
 * @returns boolean - true se é futura
 */
export function validateFutureDate(date: string | Date): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return false;
  return dateObj > new Date();
}

/**
 * Valida se a data é passada
 * @param date - Data a ser validada
 * @returns boolean - true se é passada
 */
export function validatePastDate(date: string | Date): boolean {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return false;
  return dateObj < new Date();
}
