export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "BDT", symbol: "৳", name: "Taka", locale: "bn-BD" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "hi-IN" },
];

export const DEFAULT_CURRENCY = CURRENCIES.find((c) => c.code === "USD")!;

export const formatCurrency = (
  amount: number,
  currency: Currency = DEFAULT_CURRENCY
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.code,
  }).format(amount);
};

export const getCurrencyByCode = (code: string): Currency => {
  return CURRENCIES.find((c) => c.code === code) || DEFAULT_CURRENCY;
};
