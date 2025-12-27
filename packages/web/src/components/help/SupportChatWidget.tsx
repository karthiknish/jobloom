"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, HelpCircle, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpCenter } from "./HelpCenter";

interface SupportChatWidgetProps {
  onOpenChat?: () => void;
}

export function SupportChatWidget({ onOpenChat }: SupportChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const options = [
    {
      icon: HelpCircle,
      label: "Help Center",
      description: "Browse FAQs & guides",
      action: () => {
        setIsExpanded(false);
        setShowHelp(true);
      },
    },
    {
      icon: Sparkles,
      label: "AI Assistant",
      description: "Chat with our AI",
      action: () => {
        setIsExpanded(false);
        onOpenChat?.();
      },
    },
    {
      icon: Send,
      label: "Contact Support",
      description: "Email our team",
      action: () => {
        setIsExpanded(false);
        window.location.href = "/support";
      },
    },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 w-72 bg-card border rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b bg-primary/5">
                <h4 className="font-semibold">How can we help?</h4>
                <p className="text-sm text-muted-foreground">Choose an option below</p>
              </div>
              <div className="p-2">
                {options.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={index}
                      onClick={option.action}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <HelpCenter open={showHelp} onOpenChange={setShowHelp} />
    </>
  );
}
