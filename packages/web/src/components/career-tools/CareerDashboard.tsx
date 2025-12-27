"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Rocket,
  BookOpen,
  Shield,
  TrendingUp,
  Target,
  Zap,
  Award,
  History,
  FileText,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkline } from "@/components/ui/Sparkline";
import { SkeletonCard } from "@/components/ui/loading-skeleton";
import type { CareerToolsState } from "./useCareerToolsState";

interface CareerDashboardProps {
  state: CareerToolsState;
  onSectionChange: (section: any) => void;
}

export function CareerDashboard({ state, onSectionChange }: CareerDashboardProps) {
  const { cvStats, cvAnalyses, loadingData } = state;

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonCard className="h-64 w-full" />
      </div>
    );
  }

  // Mock data for graphs if no analyses exist
  const scoreTrend = cvAnalyses && cvAnalyses.length > 0 
    ? cvAnalyses.map(a => a.overallScore || 0).reverse()
    : [65, 68, 72, 70, 78, 82, 85];

  const keywordTrend = cvAnalyses && cvAnalyses.length > 0
    ? cvAnalyses.map(a => a.keywordAnalysis?.presentKeywords?.length || 0).reverse()
    : [12, 15, 14, 18, 22, 20, 25];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Total Analyses
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">CVs processed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Avg. ATS Score
              <Rocket className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvStats?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Compatibility rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Keywords Found
              <BookOpen className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvStats?.averageKeywords || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg. per resume</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Success Rate
              <Shield className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvStats?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">High-scoring CVs</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Progression
            </CardTitle>
            <CardDescription>Your ATS score improvement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-muted/20 rounded-xl p-4">
              <Sparkline 
                data={scoreTrend} 
                width={400} 
                height={150} 
                showArea 
                showPoints 
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Keyword Optimization
            </CardTitle>
            <CardDescription>Relevant keywords detected in your CVs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-muted/20 rounded-xl p-4">
              <Sparkline 
                data={keywordTrend} 
                width={400} 
                height={150} 
                color="warning"
                showArea 
                showPoints 
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cvAnalyses && cvAnalyses.length > 0 ? (
                cvAnalyses.slice(0, 3).map((analysis) => (
                  <div key={analysis._id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded-md border">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium truncate max-w-[200px]">{analysis.fileName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(analysis.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold">{analysis.overallScore}%</div>
                        <Progress value={analysis.overallScore} className="h-1 w-16" />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => onSectionChange("cv-optimizer")}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analyses yet. Start by optimizing your CV!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm opacity-90">
              Your average score is {cvStats?.averageScore || 0}%. Aim for 85%+ to stand out to recruiters.
            </p>
            <div className="space-y-2">
              <Button 
                variant="secondary" 
                className="w-full justify-start gap-2"
                onClick={() => onSectionChange("ai-generator")}
              >
                <Sparkles className="h-4 w-4" />
                Generate AI Resume
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-start gap-2"
                onClick={() => onSectionChange("cv-optimizer")}
              >
                <Target className="h-4 w-4" />
                Optimize Current CV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
