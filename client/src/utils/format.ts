/**
 * All this is so JS dont bug (precision drift)
 * handles currency conversion (from dollars to cents & vice versa. Not multicurrency)
 * Doesn't use floating-point
 * Note this in the interview DONT FORGET
 * !IMPORTANT
 */

/**
 * Format integer minor units (cents) into localized currency string.
 */
export const formatCurrency = (cents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
};

/**
 * Convert string or dollar float into exact integer minor units (cents).
 * e.g. "85.50" -> 8550
 */
export const dollarsToCents = (val: string | number): number => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

/**
 * Convert integer minor units (cents) into decimal string for input fields.
 * e.g. 8550 -> "85.50"
 */
export const centsToDollars = (cents: number): string => {
  return (cents / 100).toFixed(2);
};
