/**
 * Digital Result Card Helpers
 * Generates permanent deterministic card numbers, security codes, and registration fallbacks.
 */

// Simple deterministic hash from string
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a permanent 16-digit card number formatted as 4-4-4-4
 * The first 4 digits are always 4005 (DPIB Institute Code).
 * The remaining 12 digits are deterministically derived from roll, studentId, and department.
 */
export function generateDeterministicCardNumber(roll: string, studentId: string, departmentId: string = ''): string {
  const cleanRoll = roll.replace(/\D/g, '') || '100000';
  const seed1 = stringToHash(`${cleanRoll}_DPIB_${departmentId}`);
  const seed2 = stringToHash(`${studentId}_CARD_${cleanRoll}`);
  
  // Format 4005 XXXX XXXX XXXX
  const part1 = '4005';
  const part2 = String(1000 + (seed1 % 9000));
  const part3 = String(1000 + ((seed1 >> 3) % 9000));
  const part4 = String(1000 + (seed2 % 9000));

  return `${part1} ${part2} ${part3} ${part4}`;
}

/**
 * Generates a permanent 3-digit security code (e.g. 742)
 */
export function generateDeterministicSecurityCode(roll: string, verificationCode: string = ''): string {
  const seed = stringToHash(`SEC_${roll}_${verificationCode || 'DPIB'}`);
  return String(100 + (seed % 900));
}

/**
 * Ensures a valid Registration number or generates an official academic identifier
 */
export function getAcademicRegistration(registration?: string, roll?: string): string {
  if (registration && registration.trim().length > 2) {
    return registration.trim();
  }
  const cleanRoll = (roll || '000000').replace(/\D/g, '');
  const hash = stringToHash(`REG_${cleanRoll}`);
  const code = String(100000 + (hash % 900000));
  return `DPIB-REG-${code}`;
}

/**
 * Calculates academic card validity period
 */
export function getCardValidityPeriod(semesterId?: string, academicYear?: string): string {
  const currentYear = new Date().getFullYear();
  const semNum = parseInt(semesterId || '1', 10) || 1;
  // Diploma is 4 years (8 semesters), compute expiry year
  const remainingYears = Math.max(1, Math.ceil((8 - semNum) / 2));
  const expiryYear = currentYear + remainingYears;
  const expiryMonth = '12';
  return `${expiryMonth}/${String(expiryYear).slice(-2)}`;
}
