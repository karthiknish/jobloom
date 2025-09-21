// components/admin/AdminStats.tsx
import type { SponsorshipStats } from "../../types/api";
import { Card, CardContent } from "@/components/ui/card";

interface AdminStatsProps {
  stats: SponsorshipStats;
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  Total Sponsored Companies
                </dt>
                <dd className="text-lg font-medium text-foreground">
                  {stats.totalSponsoredCompanies}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary/10 rounded-lg p-3">
              <span className="text-2xl">🌐</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  Industries Covered
                </dt>
                <dd className="text-lg font-medium text-foreground">
                  {Object.keys(stats.industryStats).length}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-secondary/20 rounded-lg p-3">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  Sponsorship Types
                </dt>
                <dd className="text-lg font-medium text-foreground">
                  {Object.keys(stats.sponsorshipTypeStats).length}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}