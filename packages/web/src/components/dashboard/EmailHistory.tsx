"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Mail, 
  Eye, 
  MousePointer2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { emailApi } from "@/utils/api/email";

interface EmailHistoryItem {
  id: string;
  type: string;
  reminderType?: string;
  sentAt: string;
  opened?: boolean;
  clicked?: boolean;
  delivered?: boolean;
  bounced?: boolean;
  openCount?: number;
  clickCount?: number;
  lastEventAt?: string;
  automated?: boolean;
}

interface EmailHistoryProps {
  applicationId: string;
}

export function EmailHistory({ applicationId }: EmailHistoryProps) {
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await emailApi.getHistory(applicationId);
        setHistory(response.history);
      } catch (error) {
        console.error("Failed to fetch email history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (applicationId) {
      fetchHistory();
    }
  }, [applicationId]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-20 bg-muted rounded"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Outreach History
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 rounded-lg border bg-card shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {item.reminderType || item.type}
                      </Badge>
                      {item.automated && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                          Auto
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.sentAt), "MMM d, h:mm a")}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    {/* Delivered Status */}
                    <div className="flex items-center gap-1.5 text-xs">
                      {item.bounced ? (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-red-600 font-medium">Bounced</span>
                        </>
                      ) : item.delivered ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-green-600 font-medium">Delivered</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-amber-600 font-medium">Sent</span>
                        </>
                      )}
                    </div>

                    {/* Open Tracking */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Eye className={`h-3.5 w-3.5 ${item.opened ? "text-blue-500" : "text-muted-foreground"}`} />
                      <span className={item.opened ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                        {item.opened ? `Opened (${item.openCount || 1})` : "Not opened"}
                      </span>
                    </div>

                    {/* Click Tracking */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <MousePointer2 className={`h-3.5 w-3.5 ${item.clicked ? "text-purple-500" : "text-muted-foreground"}`} />
                      <span className={item.clicked ? "text-purple-600 font-medium" : "text-muted-foreground"}>
                        {item.clicked ? `Clicked (${item.clickCount || 1})` : "No clicks"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
