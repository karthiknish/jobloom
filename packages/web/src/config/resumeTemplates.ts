export interface ResumeTemplateMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular?: boolean;
}

export const resumeTemplates: ResumeTemplateMeta[] = [
  { id: "modern", name: "Modern Professional", description: "Clean layout for tech roles", icon: "FileText", popular: true },
  { id: "classic", name: "Classic Corporate", description: "Traditional structured format", icon: "ClipboardList" },
  { id: "creative", name: "Creative Designer", description: "Bold, visual emphasis", icon: "Palette" },
  { id: "minimal", name: "Minimal Clean", description: "Whitespace focused, content-first", icon: "Sparkles" },
];

export function getResumeTemplate(id: string) {
  return resumeTemplates.find(t => t.id === id) || resumeTemplates[0];
}
