export function isNonEmptyString(value: unknown, max = 256): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
export function positiveInt(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}
