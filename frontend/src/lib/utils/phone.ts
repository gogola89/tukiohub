/**
 * Format phone number for backend API
 * Backend expects: 254XXXXXXXXX (12 digits, no + prefix)
 *
 * @param phoneNumber - Phone number in E.164 format (e.g., +254712345678)
 * @returns Formatted phone number without + prefix (e.g., 254712345678)
 */
export function formatPhoneForBackend(phoneNumber: string | undefined): string {
  if (!phoneNumber) return '';

  // Remove + prefix if present
  return phoneNumber.replace(/^\+/, '');
}

/**
 * Format phone number for display (adds + prefix)
 *
 * @param phoneNumber - Phone number (e.g., 254712345678 or +254712345678)
 * @returns Phone number with + prefix (e.g., +254712345678)
 */
export function formatPhoneForDisplay(phoneNumber: string | undefined): string {
  if (!phoneNumber) return '';

  // Add + prefix if not present
  if (!phoneNumber.startsWith('+')) {
    return `+${phoneNumber}`;
  }

  return phoneNumber;
}

/**
 * Validate Kenya phone number format
 *
 * @param phoneNumber - Phone number to validate
 * @returns true if valid Kenya phone number
 */
export function isValidKenyaPhone(phoneNumber: string | undefined): boolean {
  if (!phoneNumber) return false;

  // Remove + prefix for validation
  const cleaned = phoneNumber.replace(/^\+/, '');

  // Should be 254XXXXXXXXX (12 digits total)
  return /^254\d{9}$/.test(cleaned);
}
