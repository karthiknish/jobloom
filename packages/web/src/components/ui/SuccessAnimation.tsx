"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SuccessAnimationState {
  showConfetti: () => void;
  showCheckmark: (message?: string) => void;
}

const SuccessAnimationContext = createContext<SuccessAnimationState | null>(null);

export function useSuccessAnimation() {
  const context = useContext(SuccessAnimationContext);
  if (!context) {
    throw new Error("useSuccessAnimation must be used within a SuccessAnimationProvider");
  }
  return context;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
}

function ConfettiAnimation({ onComplete }: { onComplete: () => void }) {
  const [pieces] = useState<ConfettiPiece[]>(() => {
    const colors = [
      "bg-primary", "bg-green-500", "bg-blue-500", 
      "bg-yellow-500", "bg-pink-500", "bg-purple-500"
    ];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.3,
      rotation: Math.random() * 360,
    }));
  });

  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            x: `${piece.x}vw`,
            y: "-10px",
            rotate: 0,
            scale: 1,
          }}
          animate={{
            y: "110vh",
            rotate: piece.rotation + 720,
            scale: [1, 0.8, 1, 0.6],
          }}
          transition={{
            duration: 2.5,
            delay: piece.delay,
            ease: "easeOut",
          }}
          className={`absolute w-2 h-2 rounded-sm ${piece.color}`}
        />
      ))}
      {/* Sparkle burst at center */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <Sparkles className="h-16 w-16 text-yellow-500" />
      </motion.div>
    </div>
  );
}

interface CheckmarkAnimationProps {
  message?: string;
  onComplete: () => void;
}

function CheckmarkAnimation({ message = "Success!", onComplete }: CheckmarkAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-3"
      >
        {/* Animated ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Glow effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.5, 2] }}
            transition={{ duration: 1.2, repeat: 1 }}
            className="absolute inset-0 bg-green-500/30 rounded-full blur-xl"
          />
          {/* Check circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 shadow-xl"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
            </motion.div>
          </motion.div>
        </motion.div>
        {/* Message */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg font-semibold text-foreground bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
        >
          {message}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

export function SuccessAnimationProvider({ children }: { children: React.ReactNode }) {
  const [showingConfetti, setShowingConfetti] = useState(false);
  const [checkmarkData, setCheckmarkData] = useState<{ show: boolean; message?: string }>({ 
    show: false 
  });

  const showConfetti = useCallback(() => {
    setShowingConfetti(true);
  }, []);

  const showCheckmark = useCallback((message?: string) => {
    setCheckmarkData({ show: true, message });
  }, []);

  return (
    <SuccessAnimationContext.Provider value={{ showConfetti, showCheckmark }}>
      {children}
      <AnimatePresence>
        {showingConfetti && (
          <ConfettiAnimation onComplete={() => setShowingConfetti(false)} />
        )}
        {checkmarkData.show && (
          <CheckmarkAnimation 
            message={checkmarkData.message}
            onComplete={() => setCheckmarkData({ show: false })} 
          />
        )}
      </AnimatePresence>
    </SuccessAnimationContext.Provider>
  );
}
