"use client";

import { motion } from "framer-motion";
import { Mail, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailMarketingHeaderProps {
  onSendTestEmail: () => void;
  templates: any[];
  campaigns: any[];
}

export function EmailMarketingHeader({ 
  onSendTestEmail, 
  templates, 
  campaigns 
}: EmailMarketingHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary to-secondary shadow-xl"
    >
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white tracking-tight">Email Marketing</h1>
            <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              Create and manage email campaigns to engage with your users
            </p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={onSendTestEmail}
            >
              <Mail className="h-5 w-5 mr-2" />
              Test Email
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
