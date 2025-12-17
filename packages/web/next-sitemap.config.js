/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://hireall.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  
  // Exclude private/auth pages
  exclude: [
    '/api',
    '/api/*',
    '/admin',
    '/admin/*',
    '/dashboard',
    '/dashboard/*',
    '/settings',
    '/settings/*',
    '/cv-evaluator',
    '/sign-in',
    '/sign-up',
    '/verify-email',
    '/welcome',
    '/auth/*',
    '/application/*',
  ],
  
  // Add dynamic routes from blog
  additionalPaths: async (config) => {
    const result = [];
    
    // Add static pages with priorities
    const staticPages = [
      { loc: '/', priority: 1.0, changefreq: 'daily' },
      { loc: '/blog', priority: 0.8, changefreq: 'daily' },
      { loc: '/extension', priority: 0.9, changefreq: 'weekly' },
      { loc: '/career-tools', priority: 0.8, changefreq: 'weekly' },
      { loc: '/contact', priority: 0.6, changefreq: 'monthly' },
      { loc: '/volunteer', priority: 0.5, changefreq: 'monthly' },
      { loc: '/upgrade', priority: 0.7, changefreq: 'weekly' },
      { loc: '/privacy', priority: 0.3, changefreq: 'yearly' },
      { loc: '/terms', priority: 0.3, changefreq: 'yearly' },
      { loc: '/conditions', priority: 0.3, changefreq: 'yearly' },
    ];
    
    for (const page of staticPages) {
      result.push({
        loc: page.loc,
        priority: page.priority,
        changefreq: page.changefreq,
        lastmod: new Date().toISOString(),
      });
    }
    
    // Fetch blog posts dynamically
    try {
      // Note: In production, this would fetch from Firestore
      // For build time, we use a simpler approach
      const blogPosts = await fetchPublishedBlogSlugs();
      for (const slug of blogPosts) {
        result.push({
          loc: `/blog/${slug}`,
          priority: 0.7,
          changefreq: 'weekly',
          lastmod: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error);
    }
    
    return result;
  },
  
  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          '/api/',
          '/admin',
          '/admin/',
          '/dashboard/',
          '/settings/',
          '/sign-in',
          '/sign-up',
          '/verify-email',
          '/auth/',
        ],
      },
    ],
    additionalSitemaps: [
      // Add additional sitemaps if needed
    ],
  },
};

// Helper function to fetch blog slugs
async function fetchPublishedBlogSlugs() {
  // During build, we can't easily access Firestore
  // This would be replaced with actual API call in production
  // For now, return empty array - blog posts will be added via revalidation
  
  try {
    // Try to fetch from the API if available
    const baseUrl = process.env.SITE_URL || 'https://hireall.app';
    const response = await fetch(`${baseUrl}/api/blog/slugs`, {
      headers: {
        'Cache-Control': 'no-store',
      },
    }).catch(() => null);
    
    if (response?.ok) {
      const data = await response.json();
      return data.slugs || [];
    }
  } catch {
    // Silently fail during build
  }
  
  return [];
}
