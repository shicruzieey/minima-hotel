// Philippine Peso currency formatting
export const CURRENCY_SYMBOL = "₱";
export const CURRENCY_CODE = "PHP";

export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatCurrencyCompact = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-PH')}`;
};
