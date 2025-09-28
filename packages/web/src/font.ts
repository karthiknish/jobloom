// src/font.ts - Next.js font configuration
import { Inter, Playfair_Display } from "next/font/google";

// Expose fonts with CSS variables so they can be applied via utility classes
// and avoid importing this file inside Client Components (smaller bundles / fewer edge cases)
export const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

export const playfair = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-playfair",
	display: "swap",
});
