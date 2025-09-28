export interface ResumeTemplateMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular?: boolean;
  preview?: string;
}

export const resumeTemplates: ResumeTemplateMeta[] = [
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean, contemporary design perfect for tech and creative roles",
    icon: "FileText",
    popular: true,
    preview: "Clean lines, modern typography, optimized for ATS"
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sophisticated design for senior-level professionals",
    icon: "Award",
    preview: "Premium layout with emphasis on leadership and achievements"
  },
  {
    id: "classic",
    name: "Classic Corporate",
    description: "Traditional, structured format for corporate environments",
    icon: "ClipboardList",
    preview: "Timeless design with clear hierarchy and professional styling"
  },
  {
    id: "creative",
    name: "Creative Designer",
    description: "Bold, visual emphasis for creative professionals",
    icon: "Palette",
    preview: "Artistic layout with visual elements and creative flair"
  },
  {
    id: "minimal",
    name: "Minimal Clean",
    description: "Whitespace-focused, content-first approach",
    icon: "Sparkles",
    preview: "Ultra-clean design that lets your content shine"
  },
  {
    id: "academic",
    name: "Academic",
    description: "Structured format ideal for research and academic positions",
    icon: "GraduationCap",
    preview: "Publication-focused layout with emphasis on credentials"
  },
  {
    id: "tech",
    name: "Tech-Focused",
    description: "Optimized for software developers and IT professionals",
    icon: "Code",
    preview: "Skills and projects emphasized with technical terminology"
  },
  {
    id: "startup",
    name: "Startup",
    description: "Dynamic, energetic design for startup environments",
    icon: "Zap",
    preview: "Modern, agile-focused layout for fast-paced companies"
  },
];

export function getResumeTemplate(id: string) {
  return resumeTemplates.find(t => t.id === id) || resumeTemplates[0];
}
