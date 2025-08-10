"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExtensionIntegrationProps {
  userId: string;
}

export function ExtensionIntegration({ userId }: ExtensionIntegrationProps) {
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [jobsDetected, setJobsDetected] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      // Check for extension-specific global variable
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__jobloom_extension) {
        setIsExtensionInstalled(true);
        const extensionData = (window as unknown as Record<string, unknown>).__jobloom_extension as Record<string, unknown>;
        setJobsDetected((extensionData.jobsDetected as number) || 0);
        setLastSync(extensionData.lastSync ? new Date(extensionData.lastSync as string | number) : null);
      }
    };

    // Check immediately
    checkExtension();
    
    // Check periodically
    const interval = setInterval(checkExtension, 5000);
    
    // Also listen for extension messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'JOBOOK_EXTENSION_STATUS') {
        setIsExtensionInstalled(true);
        setJobsDetected((event.data.jobsDetected as number) || 0);
        setLastSync(event.data.lastSync ? new Date(event.data.lastSync as string | number) : null);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Send user ID to extension
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      // Post message to extension
      window.postMessage({
        type: 'JOBOOK_USER_AUTH',
        userId: userId,
        timestamp: Date.now()
      }, '*');
      
      // Also set in localStorage for extension access
      localStorage.setItem('__jobloom_user', JSON.stringify({ userId }));
    }
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chrome Extension</CardTitle>
        <CardDescription>Automatically detect and sync job postings</CardDescription>
      </CardHeader>
      <CardContent>
        {isExtensionInstalled ? (
          <div className="space-y-6">
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex-shrink-0">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Extension Installed</p>
                <p className="text-xs text-green-700">Jobs will be automatically detected and synced</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{jobsDetected}</p>
                <p className="text-sm text-muted-foreground">Jobs Detected</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                </p>
                <p className="text-sm text-muted-foreground">Last Sync</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">Active</p>
                <p className="text-sm text-muted-foreground">Status</p>
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                className="w-full"
                onClick={() => {
                  window.postMessage({
                    type: 'JOBOOK_FORCE_SYNC',
                    userId: userId
                  }, '*');
                }}
              >
                Force Sync Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex-shrink-0">
                <span className="text-yellow-600 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Extension Not Installed</p>
                <p className="text-xs text-yellow-700">Install the Chrome extension to automatically detect jobs</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The Jobloom Chrome extension automatically detects job postings on popular job sites and syncs them to your dashboard.
              </p>
              
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">1</span>
                <span>Install the Jobloom Chrome Extension</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">2</span>
                <span>Browse job sites like LinkedIn, Indeed, or Glassdoor</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">3</span>
                <span>Jobs are automatically detected and added to your dashboard</span>
              </div>
            </div>
            
            <div className="pt-2">
              <Button className="w-full" asChild>
                <a
                  href="https://chrome.google.com/webstore/detail/jobloom-extension"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Install Extension
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}