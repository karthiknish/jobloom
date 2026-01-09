"use client";

import { ShieldCheck, ShieldAlert, Clock3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VerificationStats } from "../types";

interface UserVerificationSnapshotProps {
    verificationStats: VerificationStats;
}

export function UserVerificationSnapshot({ verificationStats }: UserVerificationSnapshotProps) {
    return (
        <Card className="border-gray-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Verification Snapshot
                </CardTitle>
                <CardDescription>Email verification & health signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Verified</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        {verificationStats.verified} <span className="text-muted-foreground font-normal">({verificationStats.verificationRate}%)</span>
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Unverified</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        {verificationStats.unverified}
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
                            <Clock3 className="h-4 w-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Never logged in</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        {verificationStats.neverLoggedIn}
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
                            <Clock3 className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Dormant (&gt; 30 days)</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        {verificationStats.dormant}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
