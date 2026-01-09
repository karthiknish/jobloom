"use client";

import { Activity, Copy, Crown, ShieldAlert, Download, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserQuickActionsProps {
    onCopyEmails: () => void;
    onCopyAdminEmails: () => void;
    onCopyUnverifiedEmails: () => void;
    onExportUsers: () => void;
    onRefreshData: () => void;
    isRefreshing: boolean;
}

export function UserQuickActions({
    onCopyEmails,
    onCopyAdminEmails,
    onCopyUnverifiedEmails,
    onExportUsers,
    onRefreshData,
    isRefreshing,
}: UserQuickActionsProps) {
    return (
        <Card className="xl:col-span-3 border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Quick Actions
                </CardTitle>
                <CardDescription>Applies to the currently filtered users</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Button
                        variant="outline"
                        className="justify-start hover:bg-gray-50 border-gray-200"
                        onClick={onCopyEmails}
                    >
                        <Copy className="h-4 w-4 mr-2 text-gray-500" />
                        Copy all emails
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start hover:bg-gray-50 border-gray-200"
                        onClick={onCopyAdminEmails}
                    >
                        <Crown className="h-4 w-4 mr-2 text-purple-500" />
                        Copy admin emails
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start hover:bg-gray-50 border-gray-200"
                        onClick={onCopyUnverifiedEmails}
                    >
                        <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
                        Copy unverified emails
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start hover:bg-gray-50 border-gray-200"
                        onClick={onExportUsers}
                    >
                        <Download className="h-4 w-4 mr-2 text-blue-500" />
                        Export filtered users
                    </Button>
                    <Button
                        variant="outline"
                        className="justify-start hover:bg-gray-50 border-gray-200"
                        onClick={onRefreshData}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2 text-green-500", isRefreshing && "animate-spin")} />
                        {isRefreshing ? "Refreshing..." : "Refresh metrics"}
                    </Button>
                    <div className="sm:col-span-2 lg:col-span-3 text-xs text-muted-foreground flex items-center">
                        Tip: Apply search and filters to narrow your actions.
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
