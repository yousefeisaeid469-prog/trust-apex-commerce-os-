export type FeatureFlag = { key: string; enabled: boolean; rollout?: number; version: number };
export function isFlagEnabled(flag: FeatureFlag | undefined, subjectKey = '') {
  if (!flag?.enabled) return false;
  const rollout = Math.max(0, Math.min(100, flag.rollout ?? 100));
  if (rollout >= 100) return true;
  if (!subjectKey) return false;
  let hash = 0; for (const char of `${flag.key}:${subjectKey}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 100 < rollout;
}
