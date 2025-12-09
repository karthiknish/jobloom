import { BentoCard, BentoGrid } from "@/components/ui/BentoGrid";
import { 
  FileText, 
  PenTool, 
  MessageSquare, 
  LayoutDashboard, 
  BarChart3,
  Briefcase,
  Sparkles
} from "lucide-react";

export function BentoFeatures() {
  const features = [
    {
      title: "AI Resume Builder",
      description: "Create ATS-optimized resumes in minutes. Our AI analyzes job descriptions and tailors your resume to match keywords perfectly.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border" />,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      className: "md:col-span-2",
      cta: "Build Resume",
      href: "/resume-builder"
    },
    {
      title: "Smart Cover Letters",
      description: "Generate personalized cover letters that actually get read. No more generic templates.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10" />,
      icon: <PenTool className="h-4 w-4 text-primary" />,
      className: "md:col-span-1",
      cta: "Write Letter",
      href: "/cover-letter"
    },
    {
      title: "Interview Coach",
      description: "Practice with AI that simulates real interview scenarios and gives instant feedback.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100" />,
      icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
      className: "md:col-span-1",
      cta: "Start Practice",
      href: "/interview-prep"
    },
    {
      title: "Application Tracker",
      description: "Kanban board to organize your job search. Never miss a follow-up again.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100" />,
      icon: <LayoutDashboard className="h-4 w-4 text-orange-500" />,
      className: "md:col-span-2",
      cta: "View Board",
      href: "/dashboard"
    },
  ];

  return (
    <section className="py-24 bg-muted/30" id="features">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Everything you need to get hired.
          </h2>
          <p className="text-lg text-muted-foreground">
            Stop juggling multiple tools. HireAll brings your entire job search into one powerful workspace.
          </p>
        </div>
        
        <BentoGrid className="max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <BentoCard
              key={i}
              {...feature}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
