/** Strip spaces and dashes, leaving digits only. */
export function normalizeTaxNumber(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/** A Hungarian adószám is 11 digits: 8 (törzsszám) + 1 (ÁFA kód) + 2 (megyekód). */
export function isValidHungarianTaxNumber(input: string): boolean {
  return /^\d{11}$/.test(normalizeTaxNumber(input));
}

/** Format as XXXXXXXX-Y-ZZ. Throws if not a valid 11-digit number. */
export function formatTaxNumber(input: string): string {
  const d = normalizeTaxNumber(input);
  if (!/^\d{11}$/.test(d)) {
    throw new Error(`Invalid Hungarian tax number: ${input}`);
  }
  return `${d.slice(0, 8)}-${d.slice(8, 9)}-${d.slice(9, 11)}`;
}
