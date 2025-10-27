"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MockInterviewSection() {
  return (
    <Card className="card-depth-2 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Mock Interview Sessions
        </CardTitle>
        <CardDescription className="text-base">
          Practice with AI-powered mock interviews tailored to your target role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Available Mock Interviews</h3>
            <div className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200"
              >
                <h4 className="font-medium">Software Engineer Interview</h4>
                <p className="text-sm text-muted-foreground">
                  45 minutes • Technical + Behavioral
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200"
              >
                <h4 className="font-medium">Product Manager Interview</h4>
                <p className="text-sm text-muted-foreground">
                  30 minutes • Strategy + Leadership
                </p>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200"
              >
                <h4 className="font-medium">UX Designer Interview</h4>
                <p className="text-sm text-muted-foreground">
                  35 minutes • Design + Problem Solving
                </p>
              </motion.div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">How it works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold"
                >
                  1
                </motion.div>
                <p>Select your target role and experience level</p>
              </div>
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold"
                >
                  2
                </motion.div>
                <p>AI interviewer asks relevant questions</p>
              </div>
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold"
                >
                  3
                </motion.div>
                <p>Get detailed feedback and improvement tips</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
