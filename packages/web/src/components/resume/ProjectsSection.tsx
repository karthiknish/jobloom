"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Plus, Trash2 } from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string;
  github: string;
}

interface ProjectsSectionProps {
  items: ProjectItem[];
  add: () => void;
  remove: (id: string) => void;
  update: (index: number, updater: (draft: ProjectItem) => void) => void;
}

export function ProjectsSection({ items, add, remove, update }: ProjectsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2"><Code2 className="h-5 w-5" /> Projects</CardTitle>
        <Button size="sm" onClick={add} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((proj, idx) => (
          <div key={proj.id} className="p-4 border rounded-lg space-y-3">
            <Input placeholder="Project Name" value={proj.name} onChange={e => update(idx, d => { d.name = e.target.value; })} />
            <Textarea rows={3} placeholder="Description" value={proj.description} onChange={e => update(idx, d => { d.description = e.target.value; })} />
            <Input placeholder="Technologies (comma separated)" value={proj.technologies.join(", ")} onChange={e => update(idx, d => { d.technologies = e.target.value.split(",").map(s => s.trim()).filter(Boolean); })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Live Link" value={proj.link} onChange={e => update(idx, d => { d.link = e.target.value; })} />
              <Input placeholder="GitHub" value={proj.github} onChange={e => update(idx, d => { d.github = e.target.value; })} />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => remove(proj.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
