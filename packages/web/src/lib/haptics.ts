/**
 * Haptic Feedback Utility
 * Provides native-like tactile feedback for mobile interactions
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Vibration patterns for different haptic styles (in milliseconds)
const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 40, 20],
  error: [30, 50, 30, 50, 30],
  selection: 5,
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param style - The type of haptic feedback
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (!isHapticSupported()) return;
  
  const pattern = HAPTIC_PATTERNS[style];
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not available
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  const trigger = (style: HapticStyle = 'light') => {
    triggerHaptic(style);
  };

  return {
    trigger,
    isSupported: isHapticSupported(),
    // Convenience methods
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
    success: () => trigger('success'),
    warning: () => trigger('warning'),
    error: () => trigger('error'),
    selection: () => trigger('selection'),
  };
}

export default triggerHaptic;
