export interface PortfolioTemplateMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'minimal' | 'creative' | 'professional' | 'modern' | 'bold';
  popular?: boolean;
  features: string[];
  preview?: string;
  layouts: {
    hero: 'centered' | 'split' | 'full-width' | 'minimal';
    sections: 'grid' | 'masonry' | 'timeline' | 'cards';
    footer: 'simple' | 'detailed' | 'minimal';
  };
}

export const portfolioTemplates: PortfolioTemplateMeta[] = [
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, distraction-free design focusing on content",
    icon: "Sparkles",
    category: 'minimal',
    popular: true,
    features: ['One-page layout', 'Subtle animations', 'Typography-focused', 'Mobile-first'],
    layouts: {
      hero: 'centered',
      sections: 'grid',
      footer: 'minimal'
    }
  },
  {
    id: "developer",
    name: "Developer Portfolio",
    description: "Technical portfolio with code snippets and project showcases",
    icon: "Code2",
    category: 'professional',
    popular: true,
    features: ['Code syntax highlighting', 'Project galleries', 'Tech stack display', 'GitHub integration'],
    layouts: {
      hero: 'split',
      sections: 'masonry',
      footer: 'detailed'
    }
  },
  {
    id: "creative",
    name: "Creative Designer",
    description: "Bold, visual portfolio for creative professionals",
    icon: "Palette",
    category: 'creative',
    features: ['Image galleries', 'Colorful accents', 'Interactive elements', 'Video embeds'],
    layouts: {
      hero: 'full-width',
      sections: 'masonry',
      footer: 'detailed'
    }
  },
  {
    id: "executive",
    name: "Executive Profile",
    description: "Professional portfolio for leadership and management roles",
    icon: "Briefcase",
    category: 'professional',
    features: ['Achievement highlights', 'Leadership timeline', 'Testimonials', 'Contact forms'],
    layouts: {
      hero: 'centered',
      sections: 'timeline',
      footer: 'detailed'
    }
  },
  {
    id: "startup",
    name: "Startup Founder",
    description: "Dynamic portfolio for entrepreneurs and startup builders",
    icon: "Rocket",
    category: 'modern',
    features: ['Company showcases', 'Team sections', 'Investor relations', 'News/press'],
    layouts: {
      hero: 'split',
      sections: 'cards',
      footer: 'detailed'
    }
  },
  {
    id: "artist",
    name: "Artist Portfolio",
    description: "Visual portfolio for artists, photographers, and creatives",
    icon: "Camera",
    category: 'creative',
    features: ['Full-screen galleries', 'Lightbox viewing', 'Exhibition history', 'Artist statement'],
    layouts: {
      hero: 'full-width',
      sections: 'masonry',
      footer: 'minimal'
    }
  },
  {
    id: "consultant",
    name: "Consultant Profile",
    description: "Expert portfolio for consultants and advisors",
    icon: "Users",
    category: 'professional',
    features: ['Expertise areas', 'Case studies', 'Client testimonials', 'Industry insights'],
    layouts: {
      hero: 'centered',
      sections: 'cards',
      footer: 'detailed'
    }
  },
  {
    id: "academic",
    name: "Academic Portfolio",
    description: "Portfolio for researchers, professors, and academics",
    icon: "GraduationCap",
    category: 'professional',
    features: ['Publications list', 'Research areas', 'Teaching experience', 'Academic CV'],
    layouts: {
      hero: 'centered',
      sections: 'timeline',
      footer: 'detailed'
    }
  }
];

export function getPortfolioTemplate(id: string): PortfolioTemplateMeta | undefined {
  return portfolioTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: PortfolioTemplateMeta['category']): PortfolioTemplateMeta[] {
  return portfolioTemplates.filter(t => t.category === category);
}

export function getPopularTemplates(): PortfolioTemplateMeta[] {
  return portfolioTemplates.filter(t => t.popular);
}
