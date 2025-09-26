import { getAdminDb } from '@/firebase/admin';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ subdomain: string }>;
}

// Basic public portfolio renderer (light theme only)
export default async function PublicPortfolioPage({ params }: Props) {
  const { subdomain } = await params;
  const db = getAdminDb();

  // Lookup subdomain ownership
  const subSnap = await db.collection('subdomains').doc(subdomain).get();
  if (!subSnap.exists) return notFound();
  const { userId } = subSnap.data() as any;
  if (!userId) return notFound();

  // Fetch resume doc
  const resumeRef = db.collection('users').doc(userId).collection('resumes').doc('primary');
  const resumeSnap = await resumeRef.get();
  if (!resumeSnap.exists) return notFound();
  const data = resumeSnap.data() as any;
  if (data.visibility && data.visibility !== 'public') return notFound();

  const resume = {
    templateId: data.templateId || 'modern',
    personalInfo: data.resumeData?.personalInfo || {},
    experience: data.resumeData?.experience || [],
    projects: data.resumeData?.projects || [],
    skills: data.resumeData?.skills || [],
  };

  const accent = templateAccent(resume.templateId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`w-full py-10 ${accent.header}`}> 
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">{resume.personalInfo.fullName || subdomain}</h1>
          {resume.personalInfo.summary && (
            <p className="mt-4 text-white/90 max-w-2xl mx-auto text-lg">{resume.personalInfo.summary}</p>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {resume.experience.length > 0 && (
          <section>
            <SectionTitle title="Experience" accent={accent} />
            <div className="space-y-6">
              {resume.experience.filter((e: any) => e.company || e.position).map((e: any) => (
                <div key={e.id} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{e.position || 'Role'}</h3>
                      <p className="text-sm text-gray-600">{e.company}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{e.startDate} - {e.endDate || 'Present'}</span>
                  </div>
                  {e.description && <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{e.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.projects.some((p: any) => p.name) && (
          <section>
            <SectionTitle title="Projects" accent={accent} />
            <div className="grid md:grid-cols-2 gap-6">
              {resume.projects.filter((p: any) => p.name).map((p: any) => (
                <div key={p.id} className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  {p.description && <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.skills.length > 0 && (
          <section>
            <SectionTitle title="Skills" accent={accent} />
            <div className="flex flex-wrap gap-2">
              {resume.skills.flatMap((g: any) => g.skills.map((s: string) => s)).filter(Boolean).map((s: string) => (
                <span key={s} className={`px-3 py-1 rounded-full text-xs font-medium ${accent.badge}`}>{s}</span>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="py-10 text-center text-xs text-gray-500">Powered by HireAll</footer>
    </div>
  );
}

function templateAccent(template: string) {
  switch (template) {
    case 'classic':
      return { header: 'bg-gray-800', badge: 'bg-gray-200 text-gray-800' };
    case 'minimal':
      return { header: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-700' };
    case 'creative':
      return { header: 'bg-gradient-to-r from-fuchsia-600 to-pink-600', badge: 'bg-pink-100 text-pink-700' };
    case 'modern':
    default:
      return { header: 'bg-purple-600', badge: 'bg-purple-100 text-purple-700' };
  }
}

function SectionTitle({ title, accent }: { title: string; accent: { header: string; badge: string } }) {
  return (
    <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
      <span className="h-5 w-1.5 rounded bg-purple-500" />
      {title}
    </h2>
  );
}

export const revalidate = 60; // revalidate static snapshot every 60s