/**
 * Centralized animation constants and utilities
 */

// Animation durations (in milliseconds)
export const DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
} as const;

// Animation easing functions
export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Keyframes used in CSS-in-JS or documentation
export const KEYFRAMES = {
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },
  slideInUp: {
    from: { 
      opacity: '0',
      transform: 'translateY(10px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateY(0)'
    },
  },
  slideInDown: {
    from: { 
      opacity: '0',
      transform: 'translateY(-10px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateY(0)'
    },
  },
  slideInRight: {
    from: { 
      opacity: '0',
      transform: 'translateX(10px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateX(0)'
    },
  },
  slideInLeft: {
    from: { 
      opacity: '0',
      transform: 'translateX(-10px)'
    },
    to: { 
      opacity: '1',
      transform: 'translateX(0)'
    },
  },
  scaleIn: {
    from: { 
      opacity: '0',
      transform: 'scale(0.95)'
    },
    to: { 
      opacity: '1',
      transform: 'scale(1)'
    },
  },
  scaleOut: {
    from: { 
      opacity: '1',
      transform: 'scale(1)'
    },
    to: { 
      opacity: '0',
      transform: 'scale(0.95)'
    },
  },
  pulse: {
    '0%, 100%': { 
      opacity: '1',
      transform: 'scale(1)'
    },
    '50%': { 
      opacity: '0.8',
      transform: 'scale(1.05)'
    },
  },
  bounce: {
    '0%, 20%, 53%, 80%, 100%': { 
      transform: 'translate3d(0, 0, 0)'
    },
    '40%, 43%': { 
      transform: 'translate3d(0, -8px, 0)'
    },
    '70%': { 
      transform: 'translate3d(0, -4px, 0)'
    },
    '90%': { 
      transform: 'translate3d(0, -2px, 0)'
    },
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
} as const;

// Animation utility functions (string based)
export const createTransition = (
  properties: string | string[],
  duration: keyof typeof DURATIONS = 'normal',
  easing: keyof typeof EASING = 'easeInOut'
): string => {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  return `${props} ${DURATIONS[duration]}ms ${EASING[easing]}`;
};

// Common animation combinations
export const ANIMATIONS = {
  // Entry animations
  entry: {
    fadeIn: createTransition('opacity', 'normal', 'easeOut'),
    slideInUp: createTransition(['opacity', 'transform'], 'normal', 'easeOut'),
    slideInDown: createTransition(['opacity', 'transform'], 'normal', 'easeOut'),
    slideInRight: createTransition(['opacity', 'transform'], 'normal', 'easeOut'),
    slideInLeft: createTransition(['opacity', 'transform'], 'normal', 'easeOut'),
    scaleIn: createTransition(['opacity', 'transform'], 'fast', 'easeOut'),
  },
  // Exit animations
  exit: {
    fadeOut: createTransition('opacity', 'fast', 'easeIn'),
    slideOutUp: createTransition(['opacity', 'transform'], 'fast', 'easeIn'),
    slideOutDown: createTransition(['opacity', 'transform'], 'fast', 'easeIn'),
    slideOutRight: createTransition(['opacity', 'transform'], 'fast', 'easeIn'),
    slideOutLeft: createTransition(['opacity', 'transform'], 'fast', 'easeIn'),
    scaleOut: createTransition(['opacity', 'transform'], 'fast', 'easeIn'),
  },
  // Interactive animations
  interactive: {
    hover: createTransition(['transform', 'box-shadow'], 'fast', 'easeOut'),
    active: createTransition('transform', 'fast', 'easeInOut'),
    focus: createTransition('box-shadow', 'fast', 'easeOut'),
  },
  // Loading animations
  loading: {
    spin: 'spin 1s linear infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: 'bounce 1s infinite',
  },
} as const;

// CSS class names for animations
export const CSS_CLASSES = {
  // Entry animations
  'animate-fade-in': 'animate-fade-in',
  'animate-slide-in-up': 'animate-slide-in-up',
  'animate-slide-in-down': 'animate-slide-in-down',
  'animate-slide-in-right': 'animate-slide-in-right',
  'animate-slide-in-left': 'animate-slide-in-left',
  'animate-scale-in': 'animate-scale-in',
  
  // Exit animations
  'animate-fade-out': 'animate-fade-out',
  'animate-slide-out-up': 'animate-slide-out-up',
  'animate-slide-out-down': 'animate-slide-out-down',
  'animate-slide-out-right': 'animate-slide-out-right',
  'animate-slide-out-left': 'animate-slide-out-left',
  'animate-scale-out': 'animate-scale-out',
  
  // Interactive animations
  'animate-hover': 'animate-hover',
  'animate-active': 'animate-active',
  'animate-focus': 'animate-focus',
  
  // Loading animations
  'animate-spin': 'animate-spin',
  'animate-pulse': 'animate-pulse',
  'animate-bounce': 'animate-bounce',
  
  // Utility classes
  'animate-shake': 'animate-shake',
  'transition-all': 'transition-all',
  'transition-fast': 'transition-fast',
  'transition-normal': 'transition-normal',
  'transition-slow': 'transition-slow',
} as const;

// Animation presets for common UI patterns
export const PRESETS = {
  // Modal/Dialog animations
  modal: {
    enter: CSS_CLASSES['animate-scale-in'],
    exit: CSS_CLASSES['animate-scale-out'],
    transition: createTransition(['opacity', 'transform'], 'normal', 'easeInOut'),
  },
  
  // Tooltip animations
  tooltip: {
    enter: CSS_CLASSES['animate-slide-in-up'],
    exit: CSS_CLASSES['animate-fade-out'],
    transition: createTransition(['opacity', 'transform'], 'fast', 'easeOut'),
  },
  
  // Button animations
  button: {
    hover: CSS_CLASSES['animate-hover'],
    active: CSS_CLASSES['animate-active'],
    transition: createTransition(['transform', 'box-shadow'], 'fast', 'easeOut'),
  },
  
  // Loading states
  loading: {
    spinner: CSS_CLASSES['animate-spin'],
    pulse: CSS_CLASSES['animate-pulse'],
    skeleton: 'animate-shimmer',
  },
  
  // Notification animations
  notification: {
    enter: CSS_CLASSES['animate-slide-in-right'],
    exit: CSS_CLASSES['animate-slide-out-right'],
    transition: createTransition(['opacity', 'transform'], 'normal', 'easeInOut'),
  },
  
  // Form validation animations
  validation: {
    error: CSS_CLASSES['animate-shake'],
    success: CSS_CLASSES['animate-scale-in'],
    transition: createTransition(['transform', 'border-color'], 'fast', 'easeOut'),
  },
} as const;
