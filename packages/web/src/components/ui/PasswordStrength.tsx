"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety
    if (/[a-z]/.test(password)) strength += 1; // lowercase
    if (/[A-Z]/.test(password)) strength += 1; // uppercase
    if (/[0-9]/.test(password)) strength += 1; // numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // special characters

    return Math.min(strength, 5);
  };

  const strength = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={`space-y-2 ${className}`}
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.div
            key={level}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.2, delay: level * 0.05 }}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              level <= strength
                ? strength <= 2
                  ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : strength <= 3
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold transition-colors duration-300 ${
          strength <= 2 ? 'text-destructive' : 
          strength <= 3 ? 'text-amber-600' : 
          'text-primary'
        }`}>
          {strength === 0 && 'Very weak'}
          {strength === 1 && 'Weak'}
          {strength === 2 && 'Fair'}
          {strength === 3 && 'Good'}
          {strength === 4 && 'Strong'}
          {strength === 5 && 'Very strong'}
        </span>
        <div className="flex gap-3 text-muted-foreground">
          <div className="flex items-center gap-1">
            {password.length >= 8 ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            )}
            <span className={password.length >= 8 ? "text-foreground font-medium" : ""}>8+ chars</span>
          </div>
          <div className="flex items-center gap-1">
            {/[^A-Za-z0-9]/.test(password) ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            )}
            <span className={/[^A-Za-z0-9]/.test(password) ? "text-foreground font-medium" : ""}>Special</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
