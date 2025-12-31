"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in component boundary (${this.props.name || "Unknown"}):`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optional: window.location.reload() if we want a fresh start
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full border-red-200 shadow-lg animate-in fade-in zoom-in duration-300">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-red-900">Something went wrong</CardTitle>
              <CardDescription>
                An error occurred while rendering this section of the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="bg-red-50 p-3 rounded-md border border-red-100 overflow-hidden">
                <p className="text-xs font-mono text-red-800 break-words leading-relaxed">
                  {this.state.error?.message || "Unknown error"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleReset}
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.reload()}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
