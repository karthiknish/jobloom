// Centralized animation definitions for the Hireall platform
// Provides consistent animations and transitions across the entire application

export const animations = {
  // Duration constants (in seconds)
  duration: {
    fast: 0.18,
    normal: 0.26,
    slow: 0.36,
    slower: 0.5,
    slowest: 0.75,
  },

  // Easing functions
  easing: {
    // Linear
    linear: "linear",
    
    // Standard
    easeIn: "cubic-bezier(0.32, 0, 0.67, 0)",
    easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    
    // Custom easing for specific effects
    smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    bouncy: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    sharp: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    gentle: "cubic-bezier(0.165, 0.84, 0.44, 1)",
  },

  // Common transitions
  transitions: {
    // Fade transitions
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
    },

    fadeOut: {
      initial: { opacity: 1 },
      animate: { opacity: 0 },
      transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] },
    },

    // Slide transitions
    slideInFromTop: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
    },

    slideInFromBottom: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
    },

    slideInFromLeft: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
    },

    slideInFromRight: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
    },

    // Scale transitions
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
    },

    scaleOut: {
      initial: { opacity: 1, scale: 1 },
      animate: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] },
    },

    // Bounce effects
    bounceIn: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 },
      transition: { 
        duration: 0.4, 
        ease: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" 
      },
    },
  },
};

// Export individual animation variants for easy import
export const fadeIn = animations.transitions.fadeIn;
export const fadeOut = animations.transitions.fadeOut;
export const slideInUp = animations.transitions.slideInFromBottom;
export const slideInDown = animations.transitions.slideInFromTop;
export const slideInLeft = animations.transitions.slideInFromLeft;
export const slideInRight = animations.transitions.slideInFromRight;
export const scaleIn = animations.transitions.scaleIn;
export const scaleOut = animations.transitions.scaleOut;
export const bounceIn = animations.transitions.bounceIn;

// Tailwind-compatible duration classes for use in className strings
export const DURATION_CLASSES = {
  fast: "duration-150",
  normal: "duration-200", 
  slow: "duration-300",
  slower: "duration-500",
  slowest: "duration-700",
} as const;

// Tailwind-compatible ease classes
export const EASE_CLASSES = {
  linear: "ease-linear",
  in: "ease-in",
  out: "ease-out",
  inOut: "ease-in-out",
} as const;

// Common transition class combinations
export const TRANSITION_PRESETS = {
  fast: `transition-all ${DURATION_CLASSES.fast} ${EASE_CLASSES.out}`,
  normal: `transition-all ${DURATION_CLASSES.normal} ${EASE_CLASSES.out}`,
  slow: `transition-all ${DURATION_CLASSES.slow} ${EASE_CLASSES.out}`,
  colors: `transition-colors ${DURATION_CLASSES.normal} ${EASE_CLASSES.out}`,
  opacity: `transition-opacity ${DURATION_CLASSES.fast} ${EASE_CLASSES.out}`,
  transform: `transition-transform ${DURATION_CLASSES.normal} ${EASE_CLASSES.out}`,
} as const;

// CSS-in-JS animation utilities for non-Framer Motion usage
export const cssAnimations = {
  // CSS keyframes
  keyframes: {
    fadeIn: `
      from { opacity: 0; }
      to { opacity: 1; }
    `,
    
    slideInFromTop: `
      from { 
        opacity: 0; 
        transform: translateY(-20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    `,
    
    slideInFromBottom: `
      from { 
        opacity: 0; 
        transform: translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    `,
    
    slideInFromLeft: `
      from { 
        opacity: 0; 
        transform: translateX(-20px); 
      }
      to { 
        opacity: 1; 
        transform: translateX(0); 
      }
    `,
    
    slideInFromRight: `
      from { 
        opacity: 0; 
        transform: translateX(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateX(0); 
      }
    `,
    
    scaleIn: `
      from { 
        opacity: 0; 
        transform: scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: scale(1); 
      }
    `,
    
    pulse: `
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    `,
    
    spin: `
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    `,
    
    bounce: `
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        transform: translate3d(0, -30px, 0);
      }
      70% {
        transform: translate3d(0, -15px, 0);
      }
      90% {
        transform: translate3d(0, -4px, 0);
      }
    `,
    
    shake: `
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    `,
  },

  // CSS animation utilities
  utilities: {
    // Duration classes
    duration: {
      ultraFast: "duration-ultra-fast",
      fast: "duration-fast",
      normal: "duration-medium",
      slow: "duration-slow",
      slower: "duration-very-slow",
      slowest: "duration-ultra-slow",
    },

    // Easing classes
    ease: {
      linear: "ease-linear",
      in: "ease-in",
      out: "ease-out",
      inOut: "ease-in-out",
    },

    // Animation classes
    animate: {
      fadeIn: "animate-fade-in",
      slideInTop: "animate-slide-in-top",
      slideInBottom: "animate-slide-in-bottom",
      slideInLeft: "animate-slide-in-left",
      slideInRight: "animate-slide-in-right",
      scaleIn: "animate-scale-in",
      pulse: "animate-pulse",
      spin: "animate-spin",
      bounce: "animate-bounce",
      shake: "animate-shake",
    },

    // Transition classes
    transition: {
      all: "transition-all",
      colors: "transition-colors",
      opacity: "transition-opacity",
      transform: "transition-transform",
      shadow: "transition-shadow",
    },
  },
};

// Helper functions for common animation patterns
export const animationHelpers = {
  // Stagger animation for lists
  createStagger: (delay: number = 0.1) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      delay,
      duration: 0.3, 
      ease: "easeOut" 
    },
  }),

  // Hover animation with customizable scale
  createHover: (scale: number = 1.02) => ({
    whileHover: { 
      scale, 
      transition: { duration: 0.2, ease: "easeOut" } 
    },
    whileTap: { 
      scale: 1 - (scale - 1), 
      transition: { duration: 0.1, ease: "easeIn" } 
    },
  }),

  // Slide animation with customizable direction and distance
  createSlide: (direction: 'top' | 'bottom' | 'left' | 'right' = 'bottom', distance: number = 20) => {
    const axis = direction === 'top' || direction === 'bottom' ? 'y' : 'x';
    const value = direction === 'top' || direction === 'left' ? -distance : distance;
    
    return {
      initial: { opacity: 0, [axis]: value },
      animate: { opacity: 1, [axis]: 0 },
      exit: { opacity: 0, [axis]: value },
      transition: { duration: 0.3, ease: "easeOut" },
    };
  },

  // Fade animation with customizable duration
  createFade: (duration: number = 0.2) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration, ease: "easeOut" },
  }),

  // Scale animation with customizable scale
  createScale: (scale: number = 0.95) => ({
    initial: { opacity: 0, scale },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale },
    transition: { duration: 0.2, ease: "easeOut" },
  }),
};

// Export default for easy importing
export default animations;