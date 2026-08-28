/**
 * Utility for phone number validation (Must be exactly 10 digits)
 */
export const validatePhoneNumber = (phone?: string): { isValid: boolean; error?: string; cleanPhone?: string } => {
  if (!phone || !phone.trim()) {
    return { isValid: true };
  }

  // Strip spaces, hyphens, parentheses, plus
  let clean = phone.trim().replace(/[\s\-\(\)\+]/g, '');

  // Handle +91 or 91 prefix if 12 digits
  if (clean.startsWith('91') && clean.length === 12) {
    clean = clean.slice(2);
  }

  if (clean.length !== 10) {
    return {
      isValid: false,
      error: `Phone number must be exactly 10 digits (currently ${clean.length} digits).`,
      cleanPhone: clean,
    };
  }

  if (!/^\d{10}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Phone number must contain numbers only.',
      cleanPhone: clean,
    };
  }

  return { isValid: true, cleanPhone: clean };
};
