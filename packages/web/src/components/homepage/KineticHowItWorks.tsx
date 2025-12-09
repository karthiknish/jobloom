import { ArrowRight } from "lucide-react";

export function KineticHowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Upload Profile",
      desc: "Drop your existing resume or LinkedIn PDF. We extract your skills, experience, and achievements instantly."
    },
    {
      num: "02",
      title: "Target Job",
      desc: "Paste the job description you want. Our AI analyzes the gap between your profile and the requirements."
    },
    {
      num: "03",
      title: "Optimize & Apply",
      desc: "Generate a tailored resume and cover letter that speaks the recruiter's language. Apply with confidence."
    }
  ];

  return (
    <section className="py-24 bg-background border-t border-border">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-muted -z-10" />
          
          {steps.map((step, i) => (
            <div key={i} className="relative bg-background pt-4 md:pt-0">
              <div className="text-6xl md:text-8xl font-black text-muted mb-6 select-none">
                {step.num}
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
