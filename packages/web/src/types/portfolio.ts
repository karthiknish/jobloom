// Portfolio Data Types
export interface PortfolioSection {
  id: string;
  type: 'hero' | 'about' | 'experience' | 'projects' | 'education' | 'skills' | 'testimonials' | 'contact' | 'blog' | 'gallery' | 'custom';
  title: string;
  content: any;
  order: number;
  visible: boolean;
}

export interface PortfolioTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'spacious';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
}

export interface PortfolioSEO {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
}

export interface PortfolioSocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  email?: string;
}

export interface PortfolioAnalytics {
  googleAnalytics?: string;
  facebookPixel?: string;
}

export interface PortfolioSettings {
  isPublic: boolean;
  showContactForm: boolean;
  allowDownloads: boolean;
  password?: string;
}

export interface PortfolioData {
  id?: string;
  templateId: string;
  title: string;
  description: string;
  subdomain?: string;
  customDomain?: string;
  theme: PortfolioTheme;
  seo: PortfolioSEO;
  sections: PortfolioSection[];
  socialLinks: PortfolioSocialLinks;
  analytics: PortfolioAnalytics;
  settings: PortfolioSettings;
}

// Section Content Types
export interface HeroContent {
  headline: string;
  subheadline: string;
  backgroundImage?: string;
  ctaText: string;
  ctaLink: string;
}

export interface AboutContent {
  content: string;
  image?: string;
  skills: string[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
}

export interface ExperienceContent {
  items: ExperienceItem[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  technologies: string[];
  link?: string;
  github?: string;
  featured: boolean;
}

export interface ProjectsContent {
  items: ProjectItem[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
  gpa?: string;
  honors?: string;
}

export interface EducationContent {
  items: EducationItem[];
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface SkillsContent {
  categories: SkillCategory[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  image?: string;
  rating: number;
}

export interface TestimonialsContent {
  items: TestimonialItem[];
}

export interface ContactContent {
  email?: string;
  phone?: string;
  location?: string;
  message: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  date: string;
  tags: string[];
}

export interface BlogContent {
  posts: BlogPost[];
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  category?: string;
}

export interface GalleryContent {
  images: GalleryImage[];
}

export interface CustomContent {
  content: string;
  layout: 'text' | 'image' | 'mixed';
}

// Section Type Configuration
export interface SectionType {
  id: string;
  type: PortfolioSection['type'];
  name: string;
  icon: any;
  description: string;
}

// Checklist Progress
export interface ChecklistItem {
  id: string;
  label: string;
  helper?: string;
  completed: boolean;
  actionHint?: string;
}

// Preview Mode
export interface PreviewData {
  portfolio: PortfolioData;
  template: any;
}

// Default Section Content
export const sectionDefaults: Record<PortfolioSection['type'], any> = {
  hero: {
    headline: "Welcome to my portfolio",
    subheadline: "I'm a creative professional ready to bring your ideas to life",
    backgroundImage: "",
    ctaText: "Get In Touch",
    ctaLink: "#contact"
  },
  about: {
    content: "Tell your story here. Share your background, passions, and what drives you.",
    image: "",
    skills: []
  },
  experience: {
    items: [{
      id: "1",
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: []
    }]
  },
  projects: {
    items: [{
      id: "1",
      title: "",
      description: "",
      image: "",
      technologies: [],
      link: "",
      github: "",
      featured: false
    }]
  },
  education: {
    items: [{
      id: "1",
      institution: "",
      degree: "",
      field: "",
      graduationDate: "",
      gpa: "",
      honors: ""
    }]
  },
  skills: {
    categories: [
      { name: "Technical", skills: [] },
      { name: "Soft Skills", skills: [] },
      { name: "Tools", skills: [] }
    ]
  },
  testimonials: {
    items: [{
      id: "1",
      name: "",
      role: "",
      company: "",
      content: "",
      image: "",
      rating: 5
    }]
  },
  contact: {
    email: "",
    phone: "",
    location: "",
    message: "Let's work together!"
  },
  blog: {
    posts: [{
      id: "1",
      title: "",
      excerpt: "",
      content: "",
      image: "",
      date: "",
      tags: []
    }]
  },
  gallery: {
    images: [{
      id: "1",
      src: "",
      alt: "",
      caption: "",
      category: ""
    }]
  },
  custom: {
    content: "",
    layout: "text"
  }
};
