/**
 * ATS Keyword Libraries
 * 
 * Centralized keyword definitions for ATS scoring.
 * Modular and easy to extend.
 */

// Role-specific keywords
export const ROLE_KEYWORDS: Record<string, string[]> = {
  'software-engineer': [
    'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'angular', 'vue',
    'api', 'rest', 'graphql', 'database', 'sql', 'nosql', 'git', 'agile', 'scrum',
    'testing', 'debugging', 'ci/cd', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'algorithms', 'data structures', 'design patterns', 'microservices', 'system design'
  ],
  'frontend-developer': [
    'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular', 'svelte',
    'responsive design', 'accessibility', 'wcag', 'sass', 'less', 'tailwind', 'bootstrap',
    'webpack', 'vite', 'component library', 'state management', 'redux', 'api integration',
    'cross-browser', 'performance optimization', 'seo', 'figma', 'design systems'
  ],
  'backend-developer': [
    'node.js', 'python', 'java', 'go', 'rust', 'c#', '.net', 'django', 'flask',
    'express', 'fastapi', 'spring', 'rest api', 'graphql', 'microservices',
    'database optimization', 'caching', 'redis', 'message queues', 'rabbitmq', 'kafka',
    'authentication', 'authorization', 'security', 'scalability', 'load balancing'
  ],
  'data-scientist': [
    'python', 'r', 'sql', 'machine learning', 'deep learning', 'tensorflow', 'pytorch',
    'pandas', 'numpy', 'scikit-learn', 'statistics', 'data visualization', 'tableau',
    'jupyter', 'nlp', 'computer vision', 'a/b testing', 'hypothesis testing',
    'feature engineering', 'model deployment', 'mlops', 'spark', 'hadoop'
  ],
  'product-manager': [
    'product strategy', 'roadmap', 'user research', 'market analysis', 'competitive analysis',
    'agile', 'scrum', 'jira', 'stakeholder management', 'requirements gathering',
    'user stories', 'prioritization', 'kpis', 'metrics', 'analytics', 'a/b testing',
    'go-to-market', 'launch', 'customer feedback', 'cross-functional', 'leadership'
  ],
  'designer': [
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'ui design', 'ux design',
    'user research', 'wireframing', 'prototyping', 'design systems', 'typography',
    'color theory', 'accessibility', 'responsive design', 'user testing', 'persona',
    'journey mapping', 'information architecture', 'interaction design'
  ],
  'devops-engineer': [
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins',
    'github actions', 'gitlab ci', 'monitoring', 'prometheus', 'grafana', 'elk stack',
    'linux', 'bash', 'python', 'infrastructure as code', 'security', 'networking',
    'load balancing', 'high availability', 'disaster recovery', 'sre'
  ],
  'project-manager': [
    'project planning', 'risk management', 'stakeholder management', 'resource allocation',
    'budget management', 'scheduling', 'agile', 'waterfall', 'scrum', 'kanban',
    'jira', 'ms project', 'asana', 'communication', 'leadership', 'problem solving',
    'vendor management', 'pmp', 'prince2', 'cross-functional teams'
  ],
};

// Industry-specific keywords
export const INDUSTRY_KEYWORDS: Record<string, Record<string, string[]>> = {
  technology: {
    general: ['saas', 'b2b', 'b2c', 'startup', 'enterprise', 'agile', 'innovation', 'digital transformation'],
    cloud: ['aws', 'azure', 'gcp', 'serverless', 'iaas', 'paas', 'saas', 'multi-cloud'],
    security: ['cybersecurity', 'encryption', 'compliance', 'gdpr', 'soc2', 'penetration testing'],
    ai: ['machine learning', 'artificial intelligence', 'nlp', 'computer vision', 'generative ai'],
  },
  finance: {
    general: ['fintech', 'banking', 'investment', 'trading', 'risk management', 'compliance'],
    regulations: ['gdpr', 'pci-dss', 'sox', 'aml', 'kyc', 'mifid', 'basel'],
    products: ['payments', 'lending', 'insurance', 'wealth management', 'blockchain'],
  },
  healthcare: {
    general: ['healthtech', 'patient care', 'clinical', 'medical devices', 'pharmaceuticals'],
    regulations: ['hipaa', 'fda', 'ehr', 'interoperability', 'telehealth'],
    technology: ['health informatics', 'digital health', 'wearables', 'diagnostics'],
  },
  ecommerce: {
    general: ['retail', 'marketplace', 'omnichannel', 'direct-to-consumer', 'supply chain'],
    metrics: ['conversion rate', 'cart abandonment', 'customer lifetime value', 'aov'],
    technology: ['shopify', 'magento', 'woocommerce', 'payment processing'],
  },
  marketing: {
    digital: ['seo', 'sem', 'ppc', 'social media', 'content marketing', 'email marketing'],
    analytics: ['google analytics', 'attribution', 'roi', 'cac', 'ltv', 'conversion'],
    tools: ['hubspot', 'salesforce', 'marketo', 'mailchimp', 'segment'],
  },
};

// Action verbs by category
export const ACTION_VERBS: Record<string, string[]> = {
  leadership: [
    'led', 'managed', 'directed', 'supervised', 'orchestrated', 'coordinated',
    'oversaw', 'spearheaded', 'championed', 'headed', 'mentored', 'coached',
    'delegated', 'motivated', 'inspired', 'guided'
  ],
  achievement: [
    'achieved', 'exceeded', 'surpassed', 'accomplished', 'delivered', 'completed',
    'attained', 'earned', 'won', 'secured', 'obtained', 'realized'
  ],
  creation: [
    'created', 'designed', 'developed', 'built', 'established', 'launched',
    'initiated', 'introduced', 'pioneered', 'founded', 'constructed', 'engineered'
  ],
  improvement: [
    'improved', 'enhanced', 'optimized', 'streamlined', 'revamped', 'transformed',
    'modernized', 'upgraded', 'refined', 'strengthened', 'accelerated', 'boosted'
  ],
  analysis: [
    'analyzed', 'evaluated', 'assessed', 'researched', 'investigated', 'identified',
    'discovered', 'diagnosed', 'examined', 'reviewed', 'audited', 'measured'
  ],
  technical: [
    'engineered', 'programmed', 'configured', 'integrated', 'deployed', 'automated',
    'debugged', 'architected', 'coded', 'tested', 'implemented', 'maintained'
  ],
  communication: [
    'presented', 'communicated', 'negotiated', 'collaborated', 'liaised', 'influenced',
    'persuaded', 'advocated', 'articulated', 'facilitated', 'mediated'
  ],
};

// Impact metrics patterns
export const IMPACT_PATTERNS: RegExp[] = [
  /(\$|£|€)\s*\d+(\.\d+)?[kmb]?\b/gi,
  /\d+(\.\d+)?%\s*(growth|increase|decrease|reduction|improvement|boost)/gi,
  /\b\d+\s*(users|customers|clients|employees|team members|projects)/gi,
  /(reduced|increased|improved|grew|saved|generated|delivered).*\d+/gi,
  /\d+\s*(million|billion|thousand|hundred)\b/gi,
  /\bx\d+\s*(faster|better|more efficient)/gi,
  /\b\d+(\.\d+)?x\s*(increase|growth|improvement)/gi,
  /\btop\s*\d+%/gi,
  /\brank(ed)?\s*(#|number)?\s*\d+/gi,
];

// Soft skills keywords
export const SOFT_SKILLS = [
  'communication', 'teamwork', 'leadership', 'problem-solving', 'analytical',
  'creative', 'detail-oriented', 'organized', 'time management', 'adaptable',
  'collaborative', 'proactive', 'self-motivated', 'critical thinking', 'flexibility',
  'interpersonal', 'negotiation', 'conflict resolution', 'decision making', 'strategic'
];

// Certification keywords by domain
export const CERTIFICATION_KEYWORDS: Record<string, string[]> = {
  cloud: ['aws certified', 'azure certified', 'gcp certified', 'cka', 'ckad', 'terraform'],
  project: ['pmp', 'prince2', 'csm', 'psm', 'safe', 'pmbok'],
  security: ['cissp', 'cism', 'ceh', 'comptia security+', 'oscp'],
  data: ['cdp', 'databricks', 'snowflake', 'tableau certified'],
  development: ['oracle certified', 'microsoft certified', 'cisco certified'],
};

// Normalize keyword for matching
export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, '')
    .trim();
}

// Get keywords for a role
export function getKeywordsForRole(role: string): string[] {
  const normalizedRole = role.toLowerCase().replace(/\s+/g, '-');
  return ROLE_KEYWORDS[normalizedRole] || [];
}

// Get keywords for an industry
export function getKeywordsForIndustry(industry: string): string[] {
  const normalizedIndustry = industry.toLowerCase();
  const industryData = INDUSTRY_KEYWORDS[normalizedIndustry];
  if (!industryData) return [];
  
  return Object.values(industryData).flat();
}

// Get all action verbs
export function getAllActionVerbs(): string[] {
  return Object.values(ACTION_VERBS).flat();
}

// Check if text contains impact metrics
export function hasImpactMetrics(text: string): boolean {
  return IMPACT_PATTERNS.some(pattern => pattern.test(text));
}

// Count impact metrics in text
export function countImpactMetrics(text: string): number {
  let count = 0;
  IMPACT_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  });
  return count;
}
