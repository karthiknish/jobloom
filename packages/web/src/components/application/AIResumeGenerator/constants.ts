export const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Non-profit",
  "Other",
];

export const levelOptions = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior/Lead" },
  { value: "executive", label: "Executive/VP" },
];

export const resumeStyles = [
  { value: "modern", label: "Modern", description: "Clean and contemporary for most industries", preview: "/images/previews/modern.png" },
  { value: "classic", label: "Classic", description: "Traditional and professional for formal roles", preview: "/images/previews/classic.png" },
  { value: "startup", label: "Startup", description: "Dynamic two-column layout for tech & startups", preview: "/images/previews/startup.png" },
  { value: "academic", label: "Academic", description: "CV style prioritized for research & education", preview: "/images/previews/academic.png" },
  { value: "tech", label: "Technical", description: "Optimized for IT, Engineering & Dev roles", preview: "/images/previews/tech.png" },
  { value: "executive", label: "Executive", description: "High-level summary focus for leadership", preview: "/images/previews/executive.png" },
  { value: "designer", label: "Designer", description: "Creative portfolio-style with bold accents", preview: "/images/previews/designer.png" },
  { value: "healthcare", label: "Healthcare", description: "Medical style highlighting certifications", preview: "/images/previews/healthcare.png" },
  { value: "legal", label: "Legal", description: "Formal serif layout for law & compliance", preview: "/images/previews/legal.png" },
  { value: "creative", label: "Creative", description: "Artistic and expressive for creative fields", preview: "/images/previews/creative.png" },
];

export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};
