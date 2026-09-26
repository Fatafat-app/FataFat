/**
 * Converts amount in paise (backend format) to a formatted INR string.
 * e.g., 34900 => "₹349", 34950 => "₹349.50"
 */
export function formatPaise(paise: number | undefined | null): string {
  if (paise === undefined || paise === null || isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? `₹${rupees}` : `₹${rupees.toFixed(2)}`;
}

/**
 * Formats distance in meters to a human readable km/m string.
 * e.g., 850 => "850 m", 2400 => "2.4 km"
 */
export function formatDistance(meters: number | undefined | null): string {
  if (!meters || isNaN(meters)) return '';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formats estimated minutes to a string.
 * e.g., 35 => "30-35 mins"
 */
export function formatDeliveryTime(minutes: number | undefined | null): string {
  if (!minutes || isNaN(minutes)) return '25-30 mins';
  return `${minutes} mins`;
}
