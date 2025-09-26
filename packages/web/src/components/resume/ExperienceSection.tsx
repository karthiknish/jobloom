"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, Trash2 } from "lucide-react";

interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

interface ExperienceSectionProps {
  items: ExperienceItem[];
  add: () => void;
  remove: (id: string) => void;
  update: (index: number, updater: (draft: ExperienceItem) => void) => void;
}

export function ExperienceSection({ items, add, remove, update }: ExperienceSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Experience</CardTitle>
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((exp, idx) => (
          <div key={exp.id} className="p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Company" value={exp.company} onChange={e => update(idx, d => { d.company = e.target.value; })} />
              <Input placeholder="Position" value={exp.position} onChange={e => update(idx, d => { d.position = e.target.value; })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input placeholder="Location" value={exp.location} onChange={e => update(idx, d => { d.location = e.target.value; })} />
              <Input placeholder="Start" value={exp.startDate} onChange={e => update(idx, d => { d.startDate = e.target.value; })} />
              <Input placeholder="End" value={exp.endDate} onChange={e => update(idx, d => { d.endDate = e.target.value; })} />
              <Button variant="outline" size="sm" onClick={() => remove(exp.id)} className="justify-center"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={3} placeholder="Role description / achievements" value={exp.description} onChange={e => update(idx, d => { d.description = e.target.value; })} />
            <div className="space-y-2">
              <Label>Achievements</Label>
              {exp.achievements.map((ach, aIdx) => (
                <Input key={aIdx} placeholder={`Achievement ${aIdx + 1}`} value={ach} onChange={e => update(idx, d => { d.achievements[aIdx] = e.target.value; })} />
              ))}
              <Button variant="outline" size="sm" onClick={() => update(idx, d => { d.achievements.push(""); })}>Add Achievement</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
