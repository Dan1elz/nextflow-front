// Base64 helpers
export {
  convertToBase64,
  revertFromBase64,
  base64ToBlob,
} from "./base64.helpers";

// Toast helpers
export {
  handleError,
  handleSuccess,
  handleWarning,
  handleInfo,
} from "./toast.helpers";

// Format helpers
export {
  formatOnlyNumbers,
  formatCpfCnpj,
  formatCep,
  formatDateOnly,
  formatPhone,
  formatPercentage,
  formatCurrency,
  formatNumber,
  formatDateTime,
} from "./format.helpers";

// Date helpers
export {
  dateOnlyOptionalSchema,
  toDateOnlyString,
  getTodayDateOnly,
  parseDateOnly,
  addDaysToDateOnly,
  diffDateOnlyInDays,
} from "./date.helpers";

// Auth helpers
export { isAdmin } from "./auth.helpers";

// Forecast helpers
export {
  getUnitShortLabel,
  formatQuantity,
  formatCoverageDays,
  formatDiscount,
  formatSeasonalIndex,
  isPendingRecommendation,
  isActionableRecommendation,
  getTopActionableRecommendations,
  mergeRecommendationsIntoRun,
} from "./forecast.helpers";

// Validators
export {
  validateCpf,
  validateCnpj,
  validateCpfCnpj,
  validateOnlyNumbers,
  validateEmail,
  validatePhone,
  validateCep,
  validateNotEmpty,
  validateMinLength,
  validateMaxLength,
  validateRange,
  validateUrl,
  validateDate,
  validateFutureDate,
  validatePastDate,
} from "./validators";

// Crypto helpers
export { generateUUID } from "./crypto.helpers";
