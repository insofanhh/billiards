/**
 * Format a number as Vietnamese Dong (VND)
 * @param amount The amount to format
 * @returns Formatted string (e.g. "100.000 đ")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount);
};
