"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Rocket,
  BookOpen,
  Shield,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading-skeleton";

interface CvStatsOverviewProps {
  cvStats?: {
    total: number;
    averageScore: number;
    averageKeywords: number;
    successRate: number;
  };
  loading?: boolean;
}

export function CvStatsOverview({ cvStats, loading }: CvStatsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="shadow-sm border-gray-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4"
    >
      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Analyses
              </CardTitle>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {cvStats?.total || 0}
            </div>
            <p className="text-xs text-gray-600">
              CVs analyzed
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Average Score
              </CardTitle>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {cvStats?.averageScore || 0}%
            </div>
            <p className="text-xs text-gray-600">
              Average ATS score
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Keywords Found
              </CardTitle>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {cvStats?.averageKeywords || 0}
            </div>
            <p className="text-xs text-gray-600">
              Avg. keywords detected
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
        <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-700">
                Success Rate
              </CardTitle>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {cvStats?.successRate || 0}%
            </div>
            <p className="text-xs text-gray-600">
              High-scoring analyses
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
