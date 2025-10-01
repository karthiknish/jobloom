"use client";

import { CheckCircle2, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PremiumCapability {
  key: string;
  label: string;
  description: string;
  requires?: string[];
}

interface FeatureStatus {
  key: string;
  label: string;
  enabled: boolean;
  description: string;
}

interface FeaturesSettingsProps {
  plan: string;
  premiumCapabilities: PremiumCapability[];
  featureStatusList: FeatureStatus[];
  exportFormats: string[];
  hasFeature: (key: string, requires?: string[]) => boolean;
}

export function FeaturesSettings({
  plan,
  premiumCapabilities,
  featureStatusList,
  exportFormats,
  hasFeature
}: FeaturesSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan capabilities</CardTitle>
          <CardDescription>
            {plan === 'premium'
              ? 'Everything currently available with your premium subscription.'
              : 'Preview what unlocks instantly when you upgrade to premium.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {premiumCapabilities.map((capability) => {
              const unlocked = hasFeature(
                capability.key,
                capability.requires
              );

              return (
                <div
                  key={capability.key}
                  className="flex gap-3 rounded-lg border border-border/60 bg-background/60 p-4"
                >
                  <div
                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${
                      unlocked
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {unlocked ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{capability.label}</p>
                    <p className="text-sm text-muted-foreground">{capability.description}</p>
                    {capability.key === 'exportFormats' && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {exportFormats.length > 0 ? (
                          exportFormats.map((format) => (
                            <Badge
                              key={format}
                              variant={
                                ['json', 'pdf'].includes(format)
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="uppercase text-[10px] tracking-wide"
                            >
                              {format}
                            </Badge>
                          ))
                        ) : (
                          <Badge
                            variant="outline"
                            className="uppercase text-[10px] tracking-wide"
                          >
                            CSV
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Feature availability</CardTitle>
            <CardDescription>
              Live status of the remote feature flags powering Hireall.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {featureStatusList.map((feature) => (
              <div
                key={feature.key}
                className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{feature.label}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Badge
                  variant={feature.enabled ? 'default' : 'outline'}
                  className={feature.enabled ? 'bg-primary/10 text-primary border-primary/30' : ''}
                >
                  {feature.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}