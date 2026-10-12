/**
 * FataFat Admin Currency & Distance Formatters
 */

/**
 * Formats a Rupee amount with ₹ symbol and Indian comma formatting.
 * e.g., 499 => "₹499", 48950 => "₹48,950", 25 => "₹25"
 * NOTE: This does NOT divide by 100. It formats the rupee value directly.
 */
export function formatRupees(amount, includeSymbol = true) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSymbol ? '₹0' : '0';
  }

  const val = Number(amount);
  const formatted = Number.isInteger(val)
    ? val.toLocaleString('en-IN')
    : val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Converts backend Paise to Rupees (divides by 100).
 * e.g., 49900 paise => 499 rupees, 2500 paise => 25 rupees
 * Used once at the API ingress boundary.
 */
export function paiseToRupees(paise) {
  if (paise === undefined || paise === null || isNaN(paise)) return 0;
  const val = Number(paise);

  // If already in rupees (e.g. mock data or small numbers < 50), preserve it
  if (val > 0 && val < 100) {
    return val;
  }

  // Backend stores in paise (100 paise = ₹1)
  return Math.round(val / 100);
}

/**
 * Converts Rupees to Paise for saving to backend (multiplies by 100).
 * e.g., 25 rupees => 2500 paise
 * Used when sending fee or price updates to backend APIs.
 */
export function rupeesToPaise(rupees) {
  if (rupees === undefined || rupees === null || isNaN(rupees)) return 0;
  return Math.round(Number(rupees) * 100);
}

// formatPaise aliases formatRupees so UI components render the true rupee amount directly
export const formatPaise = formatRupees;
