"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListChecks } from "lucide-react";

interface SkillGroup { category: string; skills: string[] }
interface SkillsSectionProps {
  groups: SkillGroup[];
  update: (index: number, value: string) => void;
}

export function SkillsSection({ groups, update }: SkillsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map((group, idx) => (
          <div key={group.category} className="space-y-1">
            <Label className="font-medium">{group.category}</Label>
            <Input placeholder="Comma separated" value={group.skills.join(", ")} onChange={e => update(idx, e.target.value)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
