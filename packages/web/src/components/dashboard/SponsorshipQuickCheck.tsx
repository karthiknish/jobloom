"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Application } from "@/utils/api/dashboard";

export function SponsorshipQuickCheck({ applications }: { applications: Application[] }) {
  const sponsored = applications.filter((a) => !!a.job?.isSponsored);
  const agency = applications.filter((a) => !!a.job?.isRecruitmentAgency);
  if (!applications.length) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Sponsored</div>
            <div className="text-2xl font-semibold">{sponsored.length}</div>
          </div>
          <Badge variant="orange">Sponsored</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Recruitment Agency</div>
            <div className="text-2xl font-semibold">{agency.length}</div>
          </div>
          <Badge variant="secondary">Agency</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
