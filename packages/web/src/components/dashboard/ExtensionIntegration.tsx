"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  Chrome, 
  RefreshCw, 
  Zap, 
  Clock, 
  Briefcase,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { extensionAuthBridge } from "@/lib/extensionAuthBridge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExtensionIntegrationProps {
  userId: string;
}

export function ExtensionIntegration({ userId }: ExtensionIntegrationProps) {
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [jobsDetected, setJobsDetected] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if extension is installed with better detection
  useEffect(() => {
    const checkExtension = () => {
      try {
        // Check for extension-specific global variable
        if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__hireall_extension) {
          setIsExtensionInstalled(true);
          const extensionData = (window as unknown as Record<string, unknown>).__hireall_extension as Record<string, unknown>;
          setJobsDetected((extensionData.jobsDetected as number) || 0);
          setLastSync(extensionData.lastSync ? new Date(extensionData.lastSync as string | number) : null);
          return;
        }

        // Check if extension auth bridge is available
        if (extensionAuthBridge.isExtensionAvailable()) {
          setIsExtensionInstalled(true);
          return;
        }

        // Alternative check: try to access chrome extension API
        if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
          try {
            (window as any).chrome.runtime.sendMessage('hireall_extension_id', { type: 'PING' }, (response: any) => {
              if (response && response.type === 'PONG') {
                setIsExtensionInstalled(true);
              }
            });
          } catch (error) {
            // Extension not available
          }
        }
      } catch (error) {
        console.error('Error checking extension status:', error);
      }
    };

    // Check immediately
    checkExtension();

    // Check periodically
    const interval = setInterval(checkExtension, 5000);

    // Also listen for extension messages with better error handling
    const handleMessage = (event: MessageEvent) => {
      try {
        // Verify message origin for security
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'HIREALL_EXTENSION_STATUS') {
          setIsExtensionInstalled(true);
          setJobsDetected((event.data.jobsDetected as number) || 0);
          setLastSync(event.data.lastSync ? new Date(event.data.lastSync as string | number) : null);
        } else if (event.data.type === 'HIREALL_EXTENSION_ERROR') {
          console.error('Extension error:', event.data.message);
        }
      } catch (error) {
        console.error('Error handling extension message:', error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Send user ID to extension with better error handling
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      const sendAuthToExtension = async () => {
        try {
          // Get cached auth token (don't force refresh to avoid quota issues)
          const authResponse = await extensionAuthBridge.getAuthToken(false);
          
          if (authResponse.success && authResponse.token) {
            // Post message to extension
            window.postMessage({
              type: 'HIREALL_USER_AUTH',
              userId: userId,
              token: authResponse.token,
              userEmail: authResponse.userEmail,
              timestamp: Date.now(),
              source: 'hireall_web'
            }, '*');

            // Also set in localStorage for extension access
            localStorage.setItem('__hireall_user', JSON.stringify({
              userId,
              token: authResponse.token,
              userEmail: authResponse.userEmail,
              timestamp: Date.now(),
              source: 'hireall_web'
            }));

            // Set the Firebase user data for extension
            const firebaseUserData = { 
              id: userId, 
              email: authResponse.userEmail,
              token: authResponse.token,
              timestamp: Date.now() 
            };
            (window as any).__firebase_user = firebaseUserData;

            console.log('[ExtensionIntegration] Auth data sent to extension');
          } else {
            console.warn('[ExtensionIntegration] No auth token available for extension');
          }

          // Set a timeout to retry if extension doesn't respond
          setTimeout(() => {
            if (!isExtensionInstalled) {
              console.log('Extension not detected, retrying auth sync...');
              sendAuthToExtension();
            }
          }, 2000);
        } catch (error) {
          console.error('Failed to send auth to extension:', error);
        }
      };

      sendAuthToExtension();
    }
  }, [userId, isExtensionInstalled]);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const authResponse = await extensionAuthBridge.getAuthToken(true);
      window.postMessage(
        {
          type: "HIREALL_FORCE_SYNC",
          userId: userId,
          token: authResponse.token,
          userEmail: authResponse.userEmail,
          timestamp: Date.now()
        },
        "*"
      );
      // Simulate sync completion
      setTimeout(() => {
        setLastSync(new Date());
        setIsSyncing(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to force sync:', error);
      setIsSyncing(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className={`pb-4 ${
        isExtensionInstalled 
          ? "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30" 
          : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isExtensionInstalled 
                ? "bg-primary/20 dark:bg-emerald-900/50" 
                : "bg-blue-100 dark:bg-blue-900/50"
            }`}>
              <Chrome className={`h-6 w-6 ${
                isExtensionInstalled 
                  ? "text-primary dark:text-emerald-400" 
                  : "text-blue-600 dark:text-blue-400"
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg">Browser Extension</CardTitle>
              <CardDescription className="text-sm">
                {isExtensionInstalled 
                  ? "Connected and ready to sync jobs" 
                  : "Save jobs from any job board with one click"
                }
              </CardDescription>
            </div>
          </div>
          {isExtensionInstalled && (
            <Badge className="bg-primary hover:bg-primary text-white gap-1">
              <CheckCircle className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isExtensionInstalled ? (
          <div className="space-y-5">
            {/* Stats Grid */}
            <TooltipProvider>
            <div className="grid grid-cols-3 gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900/50 cursor-help"
                  >
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {jobsDetected}
                    </p>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Jobs Saved</p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total jobs saved from job boards via the extension</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl p-4 text-center border border-teal-100 dark:border-teal-900/50 cursor-help"
                  >
                    <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                      {lastSync ? lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                    </p>
                    <p className="text-xs text-teal-600/80 dark:text-teal-400/80">Last Sync</p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>When data was last synced from the extension</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-xl p-4 text-center border border-primary/20 dark:border-emerald-900/50 cursor-help"
                  >
                    <Zap className="h-5 w-5 text-primary dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-primary dark:text-emerald-100">
                      Active
                    </p>
                    <p className="text-xs text-primary/80 dark:text-emerald-400/80">Status</p>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Extension is connected and ready to sync</p>
                </TooltipContent>
              </Tooltip>
            </div>
            </TooltipProvider>

            {/* Sync Button */}
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white gap-2"
              onClick={handleForceSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Warning Banner */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Extension Not Installed
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Install to save jobs automatically from job boards
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">How it works:</p>
              {[
                { step: 1, text: "Install the Hireall Chrome Extension" },
                { step: 2, text: "Browse LinkedIn, Indeed, Glassdoor, and more" },
                { step: 3, text: "Click 'Add to Board' on any job listing" },
              ].map((item, index) => (
                <motion.div 
                  key={item.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                    {item.step}
                  </span>
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Install Button */}
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
              asChild
            >
              <a
                href="https://chrome.google.com/webstore/detail/hireall-extension"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Chrome className="h-4 w-4" />
                Install Chrome Extension
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}