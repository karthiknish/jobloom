import { AdminLayout } from "@/components/admin/AdminLayout";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <AdminLayout title="Analytics">
      <AnalyticsDashboard />
    </AdminLayout>
  );
}
