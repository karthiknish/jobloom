// components/admin/AdminStats.tsx
import type { SponsorshipStats } from "../../types/convex";

interface AdminStatsProps {
  stats: SponsorshipStats;
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Sponsored Companies
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalSponsoredCompanies}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
              <span className="text-2xl">🌐</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Industries Covered
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {Object.keys(stats.industryStats).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Sponsorship Types
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {Object.keys(stats.sponsorshipTypeStats).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}