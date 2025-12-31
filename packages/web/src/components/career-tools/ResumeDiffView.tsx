import React from "react";
import { 
  GitCompare, 
  X, 
  Plus, 
  Minus, 
  RefreshCcw,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderKanban
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { compareResumes, type ResumeDiff, type DiffItem, type DiffStatus } from "@/utils/resumeDiff";
import type { ResumeVersion } from "@/utils/api/resumeApi";

interface ResumeDiffViewProps {
  v1: ResumeVersion | null;
  v2: ResumeVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeDiffView({ v1, v2, open, onOpenChange }: ResumeDiffViewProps) {
  if (!v1 || !v2) return null;

  // We want to compare v1 (older possibly) with v2 (newer possibly)
  // Let's assume v1 is the baseline and v2 is the change
  const diff = compareResumes(v1.data, v2.data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                Resume Comparison
              </DialogTitle>
              <DialogDescription>
                Comparing "{v1.name}" with "{v2.name}"
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 bg-green-500/10 border border-green-500/20 rounded" />
              <span>Added</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 bg-red-500/10 border border-red-500/20 rounded" />
              <span>Removed</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 bg-amber-500/10 border border-amber-500/20 rounded" />
              <span>Modified</span>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8 pb-8">
            {/* Personal Info */}
            <Section title="Personal Info" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DiffField label="Full Name" diff={diff.personalInfo.fullName} />
                <DiffField label="Email" diff={diff.personalInfo.email} />
                <DiffField label="Phone" diff={diff.personalInfo.phone} />
                <DiffField label="Location" diff={diff.personalInfo.location} />
                <div className="sm:col-span-2">
                  <DiffField label="Summary" diff={diff.personalInfo.summary} isLongText />
                </div>
              </div>
            </Section>

            {/* Experience */}
            <Section title="Experience" icon={Briefcase}>
              <div className="space-y-4">
                {diff.experience.map((item, idx) => (
                  <DiffBlock key={idx} status={item.status}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{item.data.company}</h4>
                        <p className="text-sm font-medium text-muted-foreground">{item.data.position}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.data.startDate} - {item.data.current ? 'Present' : item.data.endDate}</span>
                    </div>
                    {item.status === 'modified' && (
                       <p className="text-xxs mt-2 text-amber-600 font-medium italic">Content within this role has changed</p>
                    )}
                  </DiffBlock>
                ))}
              </div>
            </Section>

            {/* Education */}
            <Section title="Education" icon={GraduationCap}>
              <div className="space-y-4">
                {diff.education.map((item, idx) => (
                  <DiffBlock key={idx} status={item.status}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{item.data.institution}</h4>
                        <p className="text-sm font-medium text-muted-foreground">{item.data.degree} in {item.data.field}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.data.graduationDate}</span>
                    </div>
                  </DiffBlock>
                ))}
              </div>
            </Section>

            {/* Skills */}
            <Section title="Skills" icon={Wrench}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {diff.skills.map((item, idx) => (
                  <DiffBlock key={idx} status={item.status}>
                    <h4 className="font-bold text-sm mb-2">{item.data.category}</h4>
                    <div className="flex flex-wrap gap-1">
                      {item.data.skills.map((skill: string, sIdx: number) => (
                        <Badge key={sIdx} variant="secondary" className="text-xxs">{skill}</Badge>
                      ))}
                    </div>
                  </DiffBlock>
                ))}
              </div>
            </Section>

            {/* Projects */}
            <Section title="Projects" icon={FolderKanban}>
              <div className="space-y-4">
                {diff.projects.map((item, idx) => (
                  <DiffBlock key={idx} status={item.status}>
                    <h4 className="font-bold">{item.data.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.data.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                       {item.data.technologies.map((tech: string, tIdx: number) => (
                         <Badge key={tIdx} variant="outline" className="text-xxs">{tech}</Badge>
                       ))}
                    </div>
                  </DiffBlock>
                ))}
              </div>
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DiffBlock({ status, children }: { status: DiffStatus, children: React.ReactNode }) {
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      status === 'added' ? "bg-green-500/5 border-green-500/20" :
      status === 'removed' ? "bg-red-500/5 border-red-500/20 opacity-60 grayscale-[0.5]" :
      status === 'modified' ? "bg-amber-500/5 border-amber-500/20" :
      "bg-white border-border"
    )}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {status === 'added' && <Plus className="h-3 w-3 text-green-600" />}
          {status === 'removed' && <Minus className="h-3 w-3 text-red-600" />}
          {status === 'modified' && <RefreshCcw className="h-3 w-3 text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

function DiffField({ label, diff, isLongText }: { label: string, diff: DiffItem<string>, isLongText?: boolean }) {
  if (diff.status === 'unchanged' && !diff.data) return null;

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      diff.status === 'added' ? "bg-green-500/5 border-green-500/20" :
      diff.status === 'removed' ? "bg-red-500/5 border-red-500/20 opacity-60" :
      diff.status === 'modified' ? "bg-amber-500/5 border-amber-500/20" :
      "bg-muted/30 border-transparent"
    )}>
      <Label className="text-xxs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</Label>
      <div className="text-sm font-medium">
        {diff.status === 'modified' ? (
          <div className="space-y-1">
            <div className="text-red-600/70 line-through decoration-red-600/30">{diff.oldData}</div>
            <div className="text-foreground">{diff.data}</div>
          </div>
        ) : (
          <div className={cn(
            diff.status === 'removed' && "line-through text-muted-foreground"
          )}>
            {diff.data}
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("text-xs font-medium text-foreground", className)}>
      {children}
    </span>
  );
}
