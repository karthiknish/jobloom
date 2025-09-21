"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardApi, type Application } from "@/utils/api/dashboard";
import { format } from "date-fns";
import { showSuccess, showError } from "@/components/ui/Toast";

export function UpcomingFollowUps({ applications, onChanged }: { applications: Application[]; onChanged?: () => void }) {
  const now = Date.now();
  const soon = now + 14 * 24 * 60 * 60 * 1000;
  const upcoming = applications
    .filter((a) => typeof a.followUpDate === "number" && a.followUpDate! >= now && a.followUpDate! <= soon)
    .sort((a, b) => (a.followUpDate! - b.followUpDate!));

  const markDone = async (id: string) => {
    try {
      await dashboardApi.updateApplication(id, { followUpDate: undefined });
      showSuccess("Follow-up cleared");
      onChanged?.();
    } catch (e: any) {
      showError(e?.message || "Failed to clear follow-up");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Follow-ups</CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length > 0 ? (
          <ul className="space-y-2">
            {upcoming.map((a) => (
              <li key={a._id} className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{a.job?.title} <span className="text-muted-foreground">• {a.job?.company}</span></div>
                  <div className="text-xs text-muted-foreground">Due {format(new Date(a.followUpDate!), "MMM d, yyyy")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => markDone(a._id)}>Mark done</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-4xl mb-4">✅</div>
            <h3 className="text-sm font-medium text-foreground mb-2">
              All caught up!
            </h3>
            <p className="text-xs text-muted-foreground">
              No upcoming follow-ups. Great job staying on top of your applications!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
