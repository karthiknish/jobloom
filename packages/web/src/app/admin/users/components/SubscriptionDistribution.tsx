"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { UserStats } from "../types";

interface SubscriptionDistributionProps {
    stats: UserStats;
}

export function SubscriptionDistribution({ stats }: SubscriptionDistributionProps) {
    const getPlanColor = (plan: string) => {
        switch (plan) {
            case "free":
                return "bg-gray-400";
            case "premium":
                return "bg-blue-500";
            case "enterprise":
                return "bg-purple-500";
            default:
                return "bg-gray-300";
        }
    };

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
                    {Object.entries(stats.usersByPlan || {}).map(([plan, count]) => (
                        <div key={plan} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getPlanColor(plan)}`} />
                                <span className="capitalize text-sm font-medium text-gray-700">{plan}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900">{count as number}</div>
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${getPlanColor(plan)}`}
                                        style={{
                                            width: `${Math.min(
                                                ((count as number) / (stats.totalUsers || 1)) * 100,
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
