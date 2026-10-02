export type ConfigValue = string | number | boolean;
export type ConfigEntry = { key: string; value: ConfigValue; version: number; changedBy: string; changedAt: string };
export function validateConfigKey(key: string) { if (!/^[A-Z][A-Z0-9_.-]{1,120}$/.test(key)) throw new Error('INVALID_CONFIG_KEY'); return key; }
export function nextConfigVersion(current: number | undefined) { return (current ?? 0) + 1; }
