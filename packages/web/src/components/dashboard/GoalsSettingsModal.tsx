"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Target, Briefcase, Star, TrendingUp, Save, RotateCcw } from "lucide-react";
import { useRestoreFocus } from "@/hooks/useRestoreFocus";

interface GoalsSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoals?: {
    weeklyApplications: number;
    responseRate: number;
  };
  onSaveGoals?: (goals: {
    weeklyApplications: number;
    responseRate: number;
  }) => void;
}

const DEFAULT_GOALS = {
  weeklyApplications: 10,
  responseRate: 20,
};

export function GoalsSettingsModal({
  open,
  onOpenChange,
  currentGoals = DEFAULT_GOALS,
  onSaveGoals,
}: GoalsSettingsModalProps) {
  // Using currentGoals as initial value - no useEffect needed
  // The modal remounts when opened so state resets naturally
  const [goals, setGoals] = useState(currentGoals);
  useRestoreFocus(open);

  // Removed: useEffect that synced goals with currentGoals
  // This was an anti-pattern - we can derive initial value directly
  // If parent changes currentGoals while modal is open (rare), 
  // it will update on next open via fresh mount


  const handleSave = () => {
    onSaveGoals?.(goals);
    onOpenChange(false);
  };

  const handleReset = () => {
    setGoals(DEFAULT_GOALS);
  };

  const goalPresets = [
    { name: "Casual", weeklyApplications: 5, responseRate: 15 },
    { name: "Active", weeklyApplications: 10, responseRate: 20 },
    { name: "Aggressive", weeklyApplications: 20, responseRate: 25 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Set Custom Goals
          </DialogTitle>
          <DialogDescription>
            Customize your job search targets to stay motivated and track progress.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
        <div className="space-y-6 py-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Presets</Label>
            <div className="grid grid-cols-3 gap-3">
              {goalPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setGoals({
                    weeklyApplications: preset.weeklyApplications,
                    responseRate: preset.responseRate,
                  })}
                  className={`p-3 rounded-lg border text-center transition-all hover:border-primary hover:bg-primary/5 ${
                    goals.weeklyApplications === preset.weeklyApplications
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                >
                  <p className="font-medium text-sm">{preset.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {preset.weeklyApplications}/week
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Applications Goal */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Weekly Applications</Label>
                    <p className="text-xs text-muted-foreground">Applications per week</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {goals.weeklyApplications}
                </Badge>
              </div>
              <Slider
                value={[goals.weeklyApplications]}
                onValueChange={([value]) => setGoals({ ...goals, weeklyApplications: value })}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>1</span>
                <span>50</span>
              </div>
            </CardContent>
          </Card>

          {/* Response Rate Goal */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-500/10 dark:bg-teal-500/20">
                    <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Response Rate Target</Label>
                    <p className="text-xs text-muted-foreground">Target response percentage</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {goals.responseRate}%
                </Badge>
              </div>
              <Slider
                value={[goals.responseRate]}
                onValueChange={([value]) => setGoals({ ...goals, responseRate: value })}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>5%</span>
                <span>50%</span>
              </div>
            </CardContent>
          </Card>
        </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Goals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
