/**
 * Gemini AI Service
 * 
 * This file now re-exports from the modular AI services.
 * New code should import from '@/services/ai' instead.
 */

export * from './index';

// For backward compatibility with default imports if any
import * as aiServices from './index';
export default aiServices;
