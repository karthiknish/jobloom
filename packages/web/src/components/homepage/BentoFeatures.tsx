import { BentoCard, BentoGrid } from "@/components/ui/BentoGrid";
import Image from "next/image";
import { 
  FileText, 
  PenTool, 
  MessageSquare, 
  LayoutDashboard, 
} from "lucide-react";

export function BentoFeatures() {
  const features = [
    {
      title: "AI Resume Builder",
      description: "Create ATS-optimized resumes in minutes. Our AI analyzes job descriptions and tailors your resume to match keywords perfectly.",
      header: (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border border-border">
          <Image 
            src="/images/bento/ai-resume-builder.png" 
            alt="AI Resume Builder" 
            width={400}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
      ),
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      className: "md:col-span-2",
      cta: "Build Resume",
      href: "/resume-builder"
    },
    {
      title: "Smart Cover Letters",
      description: "Generate personalized cover letters that actually get read. No more generic templates.",
      header: (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
          <Image 
            src="/images/bento/smart-cover-letter.png" 
            alt="Smart Cover Letters" 
            width={300}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
      ),
      icon: <PenTool className="h-4 w-4 text-primary" />,
      className: "md:col-span-1",
      cta: "Write Letter",
      href: "/cover-letter"
    },
    {
      title: "Volunteer Program",
      description: "Gain real experience working with UK clients. Build your portfolio while helping others.",
      header: (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <Image 
            src="/images/bento/volunteer-program.png" 
            alt="Volunteer Program" 
            width={300}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
      ),
      icon: <MessageSquare className="h-4 w-4 text-blue-500" />,
      className: "md:col-span-1",
      cta: "Learn More",
      href: "/volunteer"
    },
    {
      title: "Application Tracker",
      description: "Kanban board to organize your job search. Never miss a follow-up again.",
      header: (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <Image 
            src="/images/bento/application-tracker.png" 
            alt="Application Tracker" 
            width={400}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
      ),
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
