"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  tips: string[];
  difficulty: string;
  tags: string[];
}

interface ProgressDashboardProps {
  completedQuestions: string[];
  interviewQuestions: Record<string, InterviewQuestion[]>;
}

export default function ProgressDashboard({
  completedQuestions,
  interviewQuestions,
}: ProgressDashboardProps) {
  const totalQuestions = Object.values(interviewQuestions).flat().length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Card className="card-depth-2 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Questions Practiced
              </CardTitle>
              <div className="bg-primary/10 rounded-lg w-8 h-8 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedQuestions.length}</div>
              <p className="text-xs text-muted-foreground">
                Out of {totalQuestions} available
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Card className="card-depth-2 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Practice Sessions
              </CardTitle>
              <div className="bg-secondary/20 rounded-lg w-8 h-8 flex items-center justify-center">
                <Clock className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }}>
          <Card className="card-depth-2 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <div className="bg-yellow-100 rounded-lg w-8 h-8 flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.5</div>
              <p className="text-xs text-muted-foreground">Out of 10</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="card-depth-2 border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Practice Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div>
                <h4 className="font-medium">Behavioral Interview Practice</h4>
                <p className="text-sm text-muted-foreground">
                  2 days ago • 45 minutes
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Score: 8.7/10
              </Badge>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div>
                <h4 className="font-medium">Technical Interview Practice</h4>
                <p className="text-sm text-muted-foreground">
                  5 days ago • 30 minutes
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Score: 8.2/10
              </Badge>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
