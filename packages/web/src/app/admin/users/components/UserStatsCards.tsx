"use client";

import { motion } from "framer-motion";
import { Users, Activity, Crown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserStats } from "../types";

interface UserStatsCardsProps {
    stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        +{stats.newUsersThisMonth} this month
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">Recently active</p>
                </CardContent>
            </Card>

            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Admin Users</CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Crown className="h-4 w-4 text-purple-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.adminUsers}</div>
                    <p className="text-xs text-muted-foreground mt-1">System administrators</p>
                </CardContent>
            </Card>

            <Card className="hover:bg-gray-50 transition-all duration-200 border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Recent Logins</CardTitle>
                    <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.recentLogins}</div>
                    <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
