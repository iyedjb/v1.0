import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert product price to cents - handles both string ("R$ 1,60") and number (160) formats
export function getPriceInCents(price: string | number): number {
  if (typeof price === 'number') {
    return Math.round(price);
  }
  // Parse string format like "R$ 1,60" or "1,60"
  const cleanPrice = price.replace(/[R$\s.]/g, '').replace(',', '.');
  return Math.round(parseFloat(cleanPrice) * 100);
}

// Format price in cents to display string (e.g., 160 -> "1,60")
export function formatPriceFromCents(priceInCents: number, withSymbol = true): string {
  const value = (priceInCents / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  return withSymbol ? `R$ ${value}` : value;
}

// Get display price from product (handles both formats)
// Returns formatted price without symbol by default for flexibility
export function getDisplayPrice(price: string | number, discount = 0): string {
  const cents = getPriceInCents(price);
  const discountedCents = discount > 0 ? Math.round(cents * (1 - discount)) : cents;
  return (discountedCents / 100).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

// Get full formatted price with R$ symbol
export function getFormattedPrice(price: string | number, discount = 0): string {
  const displayValue = getDisplayPrice(price, discount);
  return `R$ ${displayValue}`;
}
