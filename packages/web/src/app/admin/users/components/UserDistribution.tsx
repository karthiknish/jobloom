"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UserStats } from "../types";

interface UserDistributionProps {
    userStats: UserStats;
}

export function UserDistribution({ userStats }: UserDistributionProps) {
    return (
        <Card className="xl:col-span-2 border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-500" />
                    Subscription Distribution
                </CardTitle>
                <CardDescription>User distribution by subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.entries(userStats.usersByPlan || {}).map(([plan, count]) => (
                        <div key={plan} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-3 h-3 rounded-full ${plan === "free"
                                            ? "bg-gray-400"
                                            : plan === "premium"
                                                ? "bg-blue-500"
                                                : plan === "enterprise"
                                                    ? "bg-purple-500"
                                                    : "bg-gray-300"
                                        }`}
                                />
                                <span className="capitalize text-sm font-medium text-gray-700">{plan}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-foreground">{count}</div>
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${plan === "free"
                                                ? "bg-gray-400"
                                                : plan === "premium"
                                                    ? "bg-blue-500"
                                                    : plan === "enterprise"
                                                        ? "bg-purple-500"
                                                        : "bg-gray-300"
                                            }`}
                                        style={{
                                            width: `${Math.min(
                                                (count / (userStats.totalUsers || 1)) * 100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
