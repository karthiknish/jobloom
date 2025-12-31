"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Search,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowRight,
  Filter,
  RefreshCw,
  Lightbulb,
  FileText,
  MessageSquare,
  TrendingDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useFirebaseAuth } from "@/providers/firebase-auth-provider";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { adminApi } from "@/utils/api/admin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showError, showSuccess } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface LearningPoint {
  _id: string;
  contentType: string;
  context?: string;
  primaryIssue: string;
  recommendation?: string;
  occurrenceCount: number;
  status: "new" | "reviewed" | "verified" | "archived";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt?: string;
}

export default function AdminLearningDashboardClient() {
  const { user } = useFirebaseAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch learning points
  const loadLearningPoints = useCallback(
    () => adminApi.learning.getLearningPoints(),
    []
  );

  const { data: learningPoints, refetch, loading } = useApiQuery(
    loadLearningPoints,
    [isAdmin],
    { enabled: isAdmin === true }
  );

  // Mutations
  const { mutate: updatePoint } = useApiMutation((args: { id: string; updates: any }) => 
    adminApi.learning.updateLearningPoint(args.id, args.updates)
  );

  const handleStatusUpdate = async (id: string, newStatus: LearningPoint["status"]) => {
    try {
      await updatePoint({ id, updates: { status: newStatus } });
      showSuccess(`Status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      showError("Failed to update status");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    showSuccess("Learning points refreshed");
  };

  const filteredPoints = (learningPoints || []).filter((point: LearningPoint) => {
    const matchesSearch = point.primaryIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         point.contentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || point.contentType === typeFilter;
    const matchesStatus = statusFilter === "all" || point.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-amber-600 bg-amber-50";
      case "low": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Verified</Badge>;
      case "reviewed": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Reviewed</Badge>;
      case "archived": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Archived</Badge>;
      default: return <Badge variant="secondary">New</Badge>;
    }
  };

  if (!user) return <AdminLayout title="AI Learning"><div className="p-8">Please sign in.</div></AdminLayout>;
  if (adminLoading) return <AdminLayout title="AI Learning"><div className="p-8">Loading admin...</div></AdminLayout>;
  if (!isAdmin) return <AdminAccessDenied />;

  return (
    <AdminLayout title="AI Learning Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Learning Loop</h1>
              <p className="text-muted-foreground">Review and verify insights gained from user feedback</p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verified Points</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(learningPoints || []).filter((p: any) => p.status === "verified").length}</div>
              <p className="text-xs text-muted-foreground mt-1">Actively improving prompts</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(learningPoints || []).filter((p: any) => p.status === "new").length}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires admin attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Table */}
        <Card className="border-gray-200 overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search issues..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cover_letter">Cover Letter</SelectItem>
                    <SelectItem value="resume">Resume</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredPoints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Issue & Recommendation</TableHead>
                    <TableHead className="text-center">Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPoints.map((point: LearningPoint) => (
                    <TableRow key={point._id} className="group">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="capitalize text-xxs w-fit">
                            {point.contentType.replace('_', ' ')}
                          </Badge>
                          <span className="text-xxs text-muted-foreground">{point.context}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          <p className="font-medium text-sm text-foreground leading-tight">{point.primaryIssue}</p>
                          {point.recommendation && (
                            <div className="flex items-start gap-1.5 p-2 bg-emerald-50/50 rounded text-emerald-800 text-xs border border-emerald-100">
                              <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                              <p>{point.recommendation}</p>
                            </div>
                          )}
                          <p className="text-xxs text-muted-foreground pt-1 italic">
                            Detected {formatDistanceToNow(new Date(point.createdAt))} ago
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-bold text-gray-700">{point.occurrenceCount}</span>
                          <span className="text-xxs text-muted-foreground">Reports</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(point.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {point.status !== "verified" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleStatusUpdate(point._id, "verified")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {point.status !== "archived" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              onClick={() => handleStatusUpdate(point._id, "archived")}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Brain className="h-12 w-12 mb-4 opacity-20" />
                <p>No learning points found.</p>
                <p className="text-sm">Feedback is processed daily to generate new insights.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
