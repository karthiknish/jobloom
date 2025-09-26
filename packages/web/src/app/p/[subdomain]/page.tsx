import { getAdminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ subdomain: string }>;
}

// Advanced public portfolio renderer
export default async function PublicPortfolioPage({ params }: Props) {
  const { subdomain } = await params;
  const db = getAdminDb();

  // Lookup subdomain ownership
  const subSnap = await db.collection('subdomains').doc(subdomain).get();
  if (!subSnap.exists) return notFound();
  const { userId } = subSnap.data() as any;
  if (!userId) return notFound();

  // Fetch portfolio data (prefer portfolio over legacy resume)
  const portfolioRef = db.collection('users').doc(userId).collection('portfolio').doc('site');
  const portfolioSnap = await portfolioRef.get();

  let portfolioData: any = null;
  let isLegacyResume = false;

  if (portfolioSnap.exists) {
    portfolioData = portfolioSnap.data();
    if (!portfolioData?.settings?.isPublic) return notFound();
  } else {
    // Fallback to legacy resume format
    const resumeRef = db.collection('users').doc(userId).collection('resumes').doc('primary');
    const resumeSnap = await resumeRef.get();
    if (!resumeSnap.exists) return notFound();
    const data = resumeSnap.data() as any;
    if (data.visibility && data.visibility !== 'public') return notFound();

    // Convert legacy resume to new portfolio format
    portfolioData = {
      templateId: data.templateId || 'modern',
      title: data.resumeData?.personalInfo?.fullName || 'Portfolio',
      description: data.resumeData?.personalInfo?.summary || '',
      theme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#64748b",
        fontFamily: "Inter",
        fontSize: "medium",
        spacing: "normal",
        borderRadius: "medium"
      },
      sections: [
        {
          id: "hero",
          type: "hero",
          title: "Hero",
          content: {
            headline: data.resumeData?.personalInfo?.fullName || "Welcome",
            subheadline: data.resumeData?.personalInfo?.summary || "",
            backgroundImage: "",
            ctaText: "View My Work",
            ctaLink: "#experience"
          },
          order: 0,
          visible: true
        },
        {
          id: "experience",
          type: "experience",
          title: "Experience",
          content: { items: data.resumeData?.experience || [] },
          order: 1,
          visible: true
        },
        {
          id: "projects",
          type: "projects",
          title: "Projects",
          content: { items: data.resumeData?.projects || [] },
          order: 2,
          visible: true
        },
        {
          id: "skills",
          type: "skills",
          title: "Skills",
          content: { categories: data.resumeData?.skills || [] },
          order: 3,
          visible: true
        }
      ],
      socialLinks: {},
      analytics: {},
      settings: { isPublic: true, showContactForm: false, allowDownloads: false }
    };
    isLegacyResume = true;
  }

  const template = portfolioData.templateId || 'minimalist';
  const theme = portfolioData.theme || {
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    fontFamily: "Inter",
    fontSize: "medium",
    spacing: "normal",
    borderRadius: "medium"
  };

  // Sort sections by order
  const visibleSections = portfolioData.sections
    ?.filter((s: any) => s.visible)
    ?.sort((a: any, b: any) => a.order - b.order) || [];

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: theme.fontFamily,
        '--primary-color': theme.primaryColor,
        '--secondary-color': theme.secondaryColor
      } as React.CSSProperties}
    >
      {/* Dynamic sections rendering */}
      {visibleSections.map((section: any) => (
        <PortfolioSection key={section.id} section={section} template={template} theme={theme} />
      ))}

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <div className="max-w-4xl mx-auto px-6">
          <p>Powered by HireAll</p>
          {portfolioData.socialLinks && Object.keys(portfolioData.socialLinks).length > 0 && (
            <div className="flex justify-center gap-4 mt-4">
              {Object.entries(portfolioData.socialLinks).map(([key, value]) => {
                if (!value) return null;
                const icons: Record<string, string> = {
                  linkedin: "linkedin",
                  github: "github",
                  twitter: "twitter",
                  instagram: "instagram",
                  youtube: "youtube",
                  website: "website",
                };
                return (
                  <a
                    key={key}
                    href={value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {icons[key] || key}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

// Portfolio Section Component
function PortfolioSection({ section, template, theme }: { section: any; template: string; theme: any }) {
  const sectionStyles = getSectionStyles(template, theme);

  switch (section.type) {
    case 'hero':
      return (
        <section className={`${sectionStyles.hero} py-20 px-6`}>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ color: sectionStyles.text }}>
              {section.content.headline || 'Welcome'}
            </h1>
            <p className="text-xl md:text-2xl mb-8" style={{ color: sectionStyles.textSecondary }}>
              {section.content.subheadline || ''}
            </p>
            {section.content.ctaText && (
              <a
                href={section.content.ctaLink || '#contact'}
                className="inline-block px-8 py-4 rounded-lg font-semibold transition-all hover:scale-105"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: 'white'
                }}
              >
                {section.content.ctaText}
              </a>
            )}
          </div>
        </section>
      );

    case 'about':
      return (
        <section className={`${sectionStyles.section} py-16 px-6`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {section.content.image && (
                <div className="text-center">
                  <img
                    src={section.content.image}
                    alt="Profile"
                    className="w-64 h-64 rounded-full mx-auto object-cover shadow-lg"
                  />
                </div>
              )}
              <div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {section.content.content || 'About section content'}
                  </p>
                </div>
                {section.content.skills && section.content.skills.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Key Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {section.content.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${theme.primaryColor}20`,
                            color: theme.primaryColor
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    case 'experience':
      return (
        <section className={`${sectionStyles.section} py-16 px-6`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">{section.title}</h2>
            <div className="space-y-8">
              {section.content.items?.map((item: any) => (
                <div key={item.id} className={`${sectionStyles.card} p-6`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{item.position || 'Position'}</h3>
                      <p className="text-lg" style={{ color: theme.primaryColor }}>
                        {item.company || 'Company'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.location && `${item.location} • `}
                        {item.startDate} - {item.endDate || 'Present'}
                      </p>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}
                  {item.achievements && item.achievements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Key Achievements</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {item.achievements.map((achievement: string, index: number) => (
                          <li key={index}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'projects':
      return (
        <section className={`${sectionStyles.section} py-16 px-6`}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">{section.title}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.content.items?.map((item: any) => (
                <div key={item.id} className={`${sectionStyles.card} p-6`}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2">{item.title || 'Project Title'}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {item.description || 'Project description'}
                  </p>
                  {item.technologies && item.technologies.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {item.technologies.map((tech: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${theme.secondaryColor}20`,
                              color: theme.secondaryColor
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline"
                        style={{ color: theme.primaryColor }}
                      >
                        View Live →
                      </a>
                    )}
                    {item.github && (
                      <a
                        href={item.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline"
                        style={{ color: theme.primaryColor }}
                      >
                        GitHub →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'skills':
      return (
        <section className={`${sectionStyles.section} py-16 px-6`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">{section.title}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {section.content.categories?.map((category: any) => (
                <div key={category.name} className={`${sectionStyles.card} p-6`}>
                  <h3 className="text-xl font-semibold mb-4">{category.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {category.skills?.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${theme.primaryColor}20`,
                          color: theme.primaryColor
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'contact':
      return (
        <section className={`${sectionStyles.section} py-16 px-6`}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">{section.title}</h2>
            <p className="text-xl text-muted-foreground mb-8">
              {section.content.message || "Let's work together!"}
            </p>
            <div className="space-y-4">
              {section.content.email && (
                <p className="text-lg">
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${section.content.email}`}
                    className="hover:underline"
                    style={{ color: theme.primaryColor }}
                  >
                    {section.content.email}
                  </a>
                </p>
              )}
              {section.content.phone && (
                <p className="text-lg">
                  <strong>Phone:</strong>{" "}
                  <a
                    href={`tel:${section.content.phone}`}
                    className="hover:underline"
                    style={{ color: theme.primaryColor }}
                  >
                    {section.content.phone}
                  </a>
                </p>
              )}
              {section.content.location && (
                <p className="text-lg">
                  <strong>Location:</strong> {section.content.location}
                </p>
              )}
            </div>
          </div>
        </section>
      );

    default:
      return (
        <section className={`${sectionStyles.section} py-16 px-6`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">{section.title}</h2>
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: section.content.content || 'Section content' }} />
            </div>
          </div>
        </section>
      );
  }
}

// Template-specific styling
function getSectionStyles(template: string, theme: any) {
  const baseStyles = {
    hero: 'min-h-screen flex items-center',
    section: 'bg-background',
    card: 'bg-card border rounded-lg shadow-sm',
    text: 'text-foreground',
    textSecondary: 'text-muted-foreground'
  };

  switch (template) {
    case 'minimalist':
      return {
        ...baseStyles,
        hero: `${baseStyles.hero} bg-gradient-to-br from-muted/30 to-muted/50`,
        section: 'bg-background',
        card: 'bg-card border-border'
      };

    case 'developer':
      return {
        ...baseStyles,
        hero: `${baseStyles.hero} bg-gradient-to-r from-slate-900 to-slate-800`,
        text: 'text-white',
        textSecondary: 'text-slate-300',
        section: 'bg-background',
        card: 'bg-card border-border'
      };

    case 'creative':
      return {
        ...baseStyles,
        hero: `${baseStyles.hero} bg-gradient-to-r from-purple-600 via-pink-600 to-red-600`,
        text: 'text-white',
        textSecondary: 'text-pink-100',
        section: 'bg-background',
        card: 'bg-card border-border shadow-lg'
      };

    case 'executive':
      return {
        ...baseStyles,
        hero: `${baseStyles.hero} bg-gradient-to-r from-blue-900 to-indigo-900`,
        text: 'text-white',
        textSecondary: 'text-blue-100',
        section: 'bg-background',
        card: 'bg-card border-border shadow-md'
      };

    default:
      return baseStyles;
  }
}


export const revalidate = 60; // revalidate static snapshot every 60s