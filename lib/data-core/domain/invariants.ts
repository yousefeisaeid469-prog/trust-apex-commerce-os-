export function assertNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative finite number`);
}

export function assertCurrency(value: string): asserts value is 'EGP' | 'USD' | 'EUR' | 'SAR' | 'AED' {
  if (!['EGP', 'USD', 'EUR', 'SAR', 'AED'].includes(value)) throw new Error('Unsupported currency');
}
