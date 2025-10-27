"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, BarChart3, TrendingUp, Activity } from "lucide-react";

interface SponsorStatsProps {
  stats: any;
}

export function SponsorStats({ stats }: SponsorStatsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getSponsorshipTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case "platinum":
        return "default";
      case "gold":
        return "secondary";
      case "silver":
        return "outline";
      case "bronze":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sponsors</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSponsoredCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Active sponsored companies
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Industry</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Object.entries(stats.industryStats || {}).length > 0
              ? Object.entries(stats.industryStats || {})
              .sort(([, a]: [string, unknown], [, b]: [string, unknown]) => (b as number) - (a as number))[0][0]
              : "None"}
          </div>
          <p className="text-xs text-muted-foreground">
            Most represented industry
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sponsorship Types</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Object.keys(stats.sponsorshipTypeStats || {}).length}
          </div>
          <p className="text-xs text-muted-foreground">
            Different sponsorship levels
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sponsors</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.sponsoredCompanies?.filter((c: any) => c.isActive !== false)
              .length || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently active
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
