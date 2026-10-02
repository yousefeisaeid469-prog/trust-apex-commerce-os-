export type ViewportTier = 'compact' | 'mobile' | 'tablet' | 'desktop';

export type MobileExperiencePolicy = {
  minTouchTargetPx: number;
  mobileBottomNavHeightPx: number;
  contentGutterPx: number;
  safeAreaAware: boolean;
  reducedMotionAware: boolean;
};

export const MOBILE_EXPERIENCE_POLICY: MobileExperiencePolicy = {
  minTouchTargetPx: 44,
  mobileBottomNavHeightPx: 64,
  contentGutterPx: 16,
  safeAreaAware: true,
  reducedMotionAware: true,
};

export function classifyViewport(widthPx: number): ViewportTier {
  if (!Number.isFinite(widthPx) || widthPx < 360) return 'compact';
  if (widthPx < 768) return 'mobile';
  if (widthPx < 1024) return 'tablet';
  return 'desktop';
}

export function clampTouchTarget(sizePx: number): number {
  if (!Number.isFinite(sizePx)) return MOBILE_EXPERIENCE_POLICY.minTouchTargetPx;
  return Math.max(MOBILE_EXPERIENCE_POLICY.minTouchTargetPx, Math.round(sizePx));
}

export function mobileContentInset(hasBottomNav: boolean): number {
  return MOBILE_EXPERIENCE_POLICY.contentGutterPx + (hasBottomNav ? MOBILE_EXPERIENCE_POLICY.mobileBottomNavHeightPx : 0);
}
