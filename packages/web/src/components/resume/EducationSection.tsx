"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Plus, Trash2 } from "lucide-react";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa: string;
  honors: string;
}

interface EducationSectionProps {
  items: EducationItem[];
  add: () => void;
  remove: (id: string) => void;
  update: (index: number, updater: (draft: EducationItem) => void) => void;
}

export function EducationSection({ items, add, remove, update }: EducationSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Education</CardTitle>
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((ed, idx) => (
          <div key={ed.id} className="p-4 border rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Institution" value={ed.institution} onChange={e => update(idx, d => { d.institution = e.target.value; })} />
              <Input placeholder="Degree" value={ed.degree} onChange={e => update(idx, d => { d.degree = e.target.value; })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Field" value={ed.field} onChange={e => update(idx, d => { d.field = e.target.value; })} />
              <Input placeholder="Graduation" value={ed.graduationDate} onChange={e => update(idx, d => { d.graduationDate = e.target.value; })} />
              <Input placeholder="GPA" value={ed.gpa} onChange={e => update(idx, d => { d.gpa = e.target.value; })} />
            </div>
            <div className="flex gap-2">
              <Textarea rows={2} placeholder="Honors / Awards" value={ed.honors} onChange={e => update(idx, d => { d.honors = e.target.value; })} />
              <Button variant="outline" size="sm" onClick={() => remove(ed.id)} className="h-fit"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
