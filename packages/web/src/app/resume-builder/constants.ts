// Resume builder constants and configurations
export const skillCategories = [
  "Programming Languages",
  "Frameworks & Libraries",
  "Tools & Technologies",
  "Databases",
  "Cloud Platforms",
  "Design & UI/UX",
  "Project Management",
  "Soft Skills"
];

export const proficiencyLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert"
];

export const resumeSections = [
  { id: "personal", label: "Personal Info", icon: "User" },
  { id: "experience", label: "Experience", icon: "Briefcase" },
  { id: "education", label: "Education", icon: "GraduationCap" },
  { id: "skills", label: "Skills", icon: "Code2" },
  { id: "projects", label: "Projects", icon: "Target" },
  { id: "certifications", label: "Certifications", icon: "Award" },
  { id: "languages", label: "Languages", icon: "Globe" }
];

export const defaultResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
    summary: ""
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: []
};