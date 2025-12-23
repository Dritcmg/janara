import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value) => {
  if (!value) return "";
  // Remove everything that is not digit
  const onlyDigits = value.replace(/\D/g, "");
  // Convert to float (cents)
  const numberValue = Number(onlyDigits) / 100;
  return numberValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const parseCurrency = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  // Remove R$, dots and replace comma with dot
  return parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
};
