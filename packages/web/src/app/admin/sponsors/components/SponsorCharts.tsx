"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface SponsorChartsProps {
  stats: any;
}

export function SponsorCharts({ stats }: SponsorChartsProps) {
  if (!stats) return null;

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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sponsorship Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sponsorship Type Distribution
          </CardTitle>
          <CardDescription>Sponsors by sponsorship level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.sponsorshipTypeStats || {}).map(
              ([type, count]: [string, unknown]) => (
                <div
                  key={type}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={getSponsorshipTypeBadge(type)}
                      className="capitalize"
                    >
                      {type}
                    </Badge>
                    <span className="text-sm font-medium capitalize">
                      {type} Sponsors
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{count as number}</div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((count as number) / (stats.totalSponsoredCompanies || 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Industry Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Industry Breakdown</CardTitle>
          <CardDescription>Top industries represented</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.industryStats || {})
              .sort(([, a]: [string, unknown], [, b]: [string, unknown]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([industry, count]: [string, unknown]) => (
                <div
                  key={industry}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm truncate">
                    {industry || "Unknown"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count as number}</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((count as number) / (stats.totalSponsoredCompanies || 1)) * 100,
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
    </div>
  );
}
