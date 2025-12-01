"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminAccessDenied() {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-700">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              You do not have permission to access the admin panel. 
              This area is restricted to administrators only.
            </p>
            
            <div className="grid gap-3">
              <Button asChild variant="default" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Home
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
            
            <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Need access?</p>
              <p>Contact a system administrator to request privileges.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}