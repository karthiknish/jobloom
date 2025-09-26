"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Briefcase } from "lucide-react";

interface PersonalInfoSectionProps {
  data: any;
  onChange: (field: string, value: string) => void;
}

export function PersonalInfoSection({ data, onChange }: PersonalInfoSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Personal Info</CardTitle>
          <CardDescription>Basic details and summary</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input value={data.fullName} onChange={e => onChange("fullName", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={data.email} onChange={e => onChange("email", e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={data.phone} onChange={e => onChange("phone", e.target.value)} />
          </div>
            <div>
            <Label>Location</Label>
            <Input value={data.location} onChange={e => onChange("location", e.target.value)} />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input value={data.linkedin} onChange={e => onChange("linkedin", e.target.value)} />
          </div>
          <div>
            <Label>GitHub</Label>
            <Input value={data.github} onChange={e => onChange("github", e.target.value)} />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={data.website} onChange={e => onChange("website", e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Professional Summary</Label>
          <Textarea rows={4} value={data.summary} onChange={e => onChange("summary", e.target.value)} placeholder="Brief summary of your background and goals..." />
        </div>
      </CardContent>
    </Card>
  );
}
