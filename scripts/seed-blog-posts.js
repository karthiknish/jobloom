#!/usr/bin/env node

/**
 * Seed Blog Posts in Firestore
 *
 * This script uses the Firebase Admin SDK to upsert a curated set of blog posts
 * into the `blogPosts` collection. It is safe to run multiple times; existing
 * posts are matched by slug and updated in place.
 *
 * Usage:
 *   node scripts/seed-blog-posts.js
 *
 * Optional environment variables:
 *   SERVICE_ACCOUNT_PATH  Absolute or relative path to the Firebase service account JSON
 *   FIREBASE_PROJECT_ID   Firebase project id (defaults to value from the service account)
 *   BLOG_AUTHOR_ID        Author id to associate with seeded posts (default: "admin")
 *   BLOG_AUTHOR_NAME      Author display name (default: "HireAll Team")
 *   BLOG_AUTHOR_EMAIL     Author email (default: "team@hireall.app")
 */

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const DEFAULT_SERVICE_ACCOUNT_PATH = path.join(
  __dirname,
  "..",
  "packages",
  "web",
  "hireall-4f106-firebase-adminsdk-fbsvc-2e91c28cd6.json"
);

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.SERVICE_ACCOUNT_PATH)
  : DEFAULT_SERVICE_ACCOUNT_PATH;

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account file not found:", serviceAccountPath);
  console.error(
    "Set SERVICE_ACCOUNT_PATH to the Firebase admin JSON or place it at the default path."
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });
}

const db = admin.firestore();

const author = {
  id: process.env.BLOG_AUTHOR_ID || "admin",
  name: process.env.BLOG_AUTHOR_NAME || "HireAll Team",
  email: process.env.BLOG_AUTHOR_EMAIL || "team@hireall.app",
};

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 120);
}

function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value;
  if (value instanceof Date) return admin.firestore.Timestamp.fromDate(value);
  if (typeof value === "number") return admin.firestore.Timestamp.fromMillis(value);
  if (typeof value === "string") return admin.firestore.Timestamp.fromDate(new Date(value));
  if (value && typeof value.toDate === "function") {
    return admin.firestore.Timestamp.fromDate(value.toDate());
  }
  throw new Error(`Unsupported timestamp value: ${value}`);
}

function estimateReadingTime(content) {
  const words = content
    .replace(/[#*_>/\\`~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const posts = [
  {
    title: "How to Track Global Talent Visa Opportunities in 2025",
    excerpt:
      "Step-by-step ways to monitor new Global Talent Visa endorsements, sponsored companies, and live openings this year.",
    content: `# How to Track Global Talent Visa Opportunities in 2025\n\nThe UK Global Talent Visa remains one of the fastest routes for highly skilled professionals to work and live in the UK. Competition is fierce, so having a repeatable research system matters. This playbook helps you track endorsement opportunities, stay ahead of the news cycle, and identify companies that are actively hiring globally.\n\n## 1. Follow Official Tech Nation Successor Updates\n- Subscribe to newsletters from the endorsing bodies that replaced Tech Nation for your specialty.\n- Set Google Alerts for key phrases like \"Global Talent Visa endorsement\" and \"Designated Competent Body updates\".\n- Monitor Github issues and community forums where engineers share application timelines.\n\n## 2. Map Sponsored Companies Each Month\nCreate a spreadsheet that includes: industry, headcount, HQ location, and the visa types each company supports. Use public records, company blogs, and FOI responses to keep it current. HireAll’s sponsor tracker can jump-start the list with verified employers.\n\n## 3. Track Hiring Signals\nLook for signs that a company is scaling globally: new fundraises, engineering leadership hires, and job ads with relocation benefits. When you see a company post the same role in multiple geographies, add it to your outreach list.\n\n## 4. Personalize Your Outreach\nRemote-first companies receive generic cold emails daily. Mention the specific products you admire, include 1-2 bullet points about how you can help with their next roadmap milestone, and link to proof of work.\n\n> Tip: Keep a running doc of endorsements and testimonials that speak to your niche expertise. These quotes make your cover letters stand out.\n\n## 5. Stay Interview Ready\n- Practice a 3-minute narrative that connects your achievements with the employer’s vision.\n- Prepare STAR examples that highlight high-impact projects, not just responsibilities.\n- Collect evidence for policy and advocacy contributions if you are applying through the \"exceptional promise\" route.\n\nBeing consistent with this workflow means you always have warm conversations lined up when a new visa window opens.`,
    category: "Visa & Sponsorship",
    tags: ["global talent visa", "sponsorship", "career strategy"],
    featuredImage:
      "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Track Global Talent Visa Opportunities in 2025",
    seoDescription:
      "Learn how to stay ahead of Global Talent Visa endorsements, sponsored employers, and hiring signals with a repeatable research system.",
    metaKeywords: ["global talent visa", "uk visa", "sponsored jobs", "tech nation successor"],
    publishedAt: "2025-01-03T09:00:00Z",
  },
  {
    title: "Sponsored Job Application Checklist for 2025",
    excerpt:
      "Follow this checklist before you hit submit to improve response rates with employers who offer visa sponsorship.",
    content: `# Sponsored Job Application Checklist for 2025\n\nHiring teams move fast, and sponsored candidates must remove friction from the very first interaction. Use this checklist to send applications that answer a recruiter's unspoken questions before they even ask.\n\n## 1. Confirm the Sponsorship Policy\n- Screenshot the line in the job description that references visa support or mention the policy from the company’s careers page.\n- Save proof in a notes doc so you can reference it in follow-up emails.\n\n## 2. Tailor Your CV for Automated Filters\n- Mirror the job title and core skills in your summary and experience bullets.\n- Add a short \"Location & Work Authorization\" block near the top that states your visa timeline and relocation readiness.\n- Export a clean PDF (no fancy columns) to keep the ATS happy.\n\n## 3. Customize Your Cover Letter\n- Lead with a high-impact accomplishment that relates to their roadmap.\n- Explain why you are prepared to relocate or work remotely across time zones.\n- Highlight any prior experience collaborating with distributed teams.\n\n## 4. Prep Your Digital Assets\n- Ensure LinkedIn headline matches the role you want.\n- Pin proof-of-work posts or case studies that show measurable outcomes.\n- Update GitHub or portfolio links embedded in your CV.\n\n## 5. Plan the Follow-Up\n- Send a concise note 3-4 business days later referencing the traction in the market that makes you excited about their team.\n- Share a fresh relevant insight instead of asking \"Did you see my application?\".\n\nCandidates that do this consistently see faster callbacks because they reduce the employer’s uncertainty about sponsorship costs and onboarding risk.`,
    category: "Job Search",
    tags: ["sponsored jobs", "application tips", "cover letter"],
    featuredImage:
      "https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Sponsored Job Application Checklist",
    seoDescription:
      "A step-by-step checklist to optimize CVs, cover letters, and follow-ups when applying for visa-sponsored roles in 2025.",
    metaKeywords: ["sponsored jobs", "visa support", "job application", "checklist"],
    publishedAt: "2025-01-08T11:30:00Z",
  },
  {
    title: "AI Screening Tools Recruiters Use (and How to Stand Out)",
    excerpt:
      "Understand the AI tools scanning your resume and learn actionable tactics to make sure your application survives the first review.",
    content: `# AI Screening Tools Recruiters Use (and How to Stand Out)\n\nFrom resume parsers to interview summarizers, AI is embedded in every stage of the hiring funnel. Knowing how these tools score candidates helps you tailor your application to win higher rankings without gaming the system.\n\n## 1. Resume Parsers\nApplicant tracking systems like Greenhouse, Workable, and Lever use AI modules that prioritize structured data. Keep formatting simple, use standard section headings, and turn achievements into metric-driven bullet points so the parser assigns a high relevance score.\n\n## 2. Skill Matching Engines\nVendors such as Eightfold and SeekOut analyze your experience against internal talent graphs. Map your skills to business impact (e.g., \"Increased pipeline conversion by 18% after implementing ML-based lead scoring\"). This phrasing mirrors the output these tools are trained to recognize.\n\n## 3. Video Interview Analytics\nPlatforms like HireVue transcribe your responses and benchmark them against top performers. Practice concise, confident answers and vary your tone to avoid sounding scripted. Share frameworks (PAST, STAR, SHIP) so the model tags your response as structured.\n\n## 4. Reference & Background Bots\nExpect automated outreach to references and background checks that verify employment dates. Keep your LinkedIn and CV aligned to avoid false red flags.\n\n## 5. Human Checkpoints Still Matter\nAI shortcuts save recruiters time, but people still make final decisions. Build relationships with hiring managers on LinkedIn and share relevant work samples so your application gets the manual review it deserves.`,
    category: "Interview Prep",
    tags: ["ai hiring", "ats", "interview prep"],
    featuredImage:
      "https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "AI Tools Recruiters Use in 2025",
    seoDescription:
      "Learn how modern AI recruiting software reads your resume and how to position yourself to survive automated screening.",
    metaKeywords: ["ai hiring", "applicant tracking system", "resume tips", "hirevue"],
    publishedAt: "2025-01-12T08:45:00Z",
  },
  {
    title: "How to Research Companies Offering Visa Sponsorship",
    excerpt:
      "Build a repeatable research workflow to spot employers that actively relocate international talent before roles hit job boards.",
    content: `# How to Research Companies Offering Visa Sponsorship

Finding companies that genuinely support visa sponsorship requires more than a quick keyword search. Follow this workflow to identify employers that are serious about relocating global talent.

## 1. Start with Official Visa Databases
Many governments maintain public records of organizations licensed to sponsor workers.

- **UK:** Browse the Home Office list of licensed sponsors filtered by industry.
- **Canada:** Review the Global Talent Stream employer directory.
- **Australia:** Use the Registered Sponsors list for the Temporary Skill Shortage visa.

## 2. Layer on Funding and Hiring Signals
- Track recent funding rounds on Crunchbase or Dealroom. Newly funded startups often expand internationally.
- Set up Google Alerts for phrases like “relocation support” and “visa sponsorship” along with your target role.
- Monitor hiring surges on LinkedIn Talent Insights where a company’s headcount is growing rapidly in multiple regions.

## 3. Analyze Job Descriptions
- Search for “visa sponsorship,” “relocation budget,” or “global mobility” inside the posting.
- Confirm which visas they reference (H-1B, Global Talent, Intra-company transfer, etc.).
- Note whether the company covers dependents or provides legal counsel—strong indicators of structured programs.

## 4. Validate Through Employee Insights
- Read Glassdoor and Blind threads for relocation experiences.
- Network with current employees to ask about relocation packages and timelines.
- Check if the company features relocation stories on their blog or social media.

## 5. Create a Sponsorship Tracker
Maintain a spreadsheet containing:

- Company name and industry
- Sponsorship program details
- Supported visa categories
- Contact notes and recruiter names
- Links to job postings and public announcements

Updating this tracker weekly ensures you move fast when new openings appear.`,
    category: "Visa & Sponsorship",
    tags: ["sponsorship research", "relocation", "global hiring"],
    featuredImage:
      "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Researching Visa Sponsorship Employers",
    seoDescription:
      "Learn how to identify and validate companies that regularly sponsor international hires before roles hit public boards.",
    metaKeywords: ["visa sponsorship research", "relocation companies", "global hiring"],
    publishedAt: "2025-01-15T10:00:00Z",
  },
  {
    title: "Crafting a Portfolio that Impresses Global Hiring Managers",
    excerpt:
      "Showcase impact, cross-cultural collaboration, and proof of execution so international teams can trust you from day one.",
    content: `# Crafting a Portfolio that Impresses Global Hiring Managers

When companies hire internationally, they need to know you will deliver results despite time zones and cultural differences. Your portfolio should tell that story clearly.

## 1. Lead with Outcomes
Replace generic project descriptions with measurable impact. Instead of “Built API integration,” say “Launched payment API supporting 42 countries and increased conversion by 18%.”

## 2. Highlight Remote Collaboration
Showcase projects executed with distributed teammates:
- Mention tools (Notion, Miro, Figma, Jira) that kept collaboration smooth.
- Include testimonials from colleagues in different locations.
- Describe how you navigated language or cultural nuances.

## 3. Demonstrate Documentation Skills
Global teams rely on async communication. Add links to specs, how-to guides, or Loom videos you created to keep projects moving while others were offline.

## 4. Localize the Presentation
- Use clear English and avoid region-specific slang.
- Provide context about local regulations if your work involved compliance (GDPR, SOC2, etc.).
- Offer quick facts (project duration, role, tech stack) at the top of each case study for fast scanning.

## 5. Include “Day Zero” Contributions
How can you add value in the first 30 days? Add a short section outlining opportunities you spotted during research. This shows initiative and strategic thinking.

Update your portfolio quarterly so it always reflects your latest wins.`,
    category: "Portfolio & Branding",
    tags: ["portfolio", "career branding", "remote work"],
    featuredImage:
      "https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Global Portfolio Tips for Remote Hiring",
    seoDescription:
      "Structure your professional portfolio to highlight impact, documentation, and cross-cultural collaboration for international recruiters.",
    metaKeywords: ["portfolio tips", "global hiring", "remote collaboration"],
    publishedAt: "2025-01-17T09:30:00Z",
  },
  {
    title: "Navigating Tech Layoffs as an International Candidate",
    excerpt:
      "Turn a layoff into momentum with a focused plan covering legal status, job search positioning, and mental resilience.",
    content: `# Navigating Tech Layoffs as an International Candidate

Layoffs are disruptive, but they hit international professionals harder because visa timelines are unforgiving. Use this action plan to regain momentum fast.

## 1. Clarify Your Legal Window Immediately
- Confirm grace periods (e.g., 60 days for H-1B, 90 days for UK Skilled Worker).
- Ask your former employer for supporting documentation and reference letters while HR is responsive.
- Explore switching to job-seeker visas or visitor status if available.

## 2. Update Storytelling Quickly
- Reframe the layoff as an industry-wide trend instead of personal failure.
- Highlight accomplishments achieved during your tenure before the restructuring.
- Prepare a concise narrative for interviews and networking calls.

## 3. Rebuild Routine and Support Systems
- Set daily job search targets (applications, outreach, prep sessions).
- Join accountability groups of other laid-off professionals.
- Reserve time for exercise or community volunteering to protect mental health.

## 4. Target Companies Still Expanding
- Focus on product-led growth companies and sectors that remain resilient (AI tooling, climate tech, healthcare).
- Track hiring announcements on LinkedIn and investor updates.
- Reach out to recruiters managing relocation pipelines; they often have unadvertised openings.

## 5. Prepare Backup Scenarios
- Consider contract roles, remote-first teams, or relocating to visa-friendly hubs.
- If timelines are tight, explore pursuing further education or incubator programs that refresh your status.

Momentum matters more than perfection. Small, consistent actions compound into new offers faster than waiting for the “ideal” opportunity.`,
    category: "Career Strategy",
    tags: ["layoffs", "visa", "job search"],
    featuredImage:
      "https://images.pexels.com/photos/3184464/pexels-photo-3184464.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "International Tech Layoff Playbook",
    seoDescription:
      "Step-by-step guidance for navigating layoffs as a visa-dependent professional, from legal timelines to job search routines.",
    metaKeywords: ["tech layoffs", "international workers", "visa grace period"],
    publishedAt: "2025-01-19T12:00:00Z",
  },
  {
    title: "Building a Talent Pipeline with LinkedIn Creator Mode",
    excerpt:
      "Use LinkedIn Creator Mode to attract recruiters, prove expertise, and convert profile views into warm conversations.",
    content: `# Building a Talent Pipeline with LinkedIn Creator Mode

LinkedIn’s Creator Mode is more than a vanity toggle—it’s a distribution engine for professionals who want inbound opportunities.

## 1. Optimize Creator Topics
- Pick five hashtags aligned with roles you want (#productmanagement, #sponsorship, #uxresearch).
- Audit which hashtags your target companies follow and mirror that language.

## 2. Post with Intentional Cadence
- Share one short-form insight post and one carousel or long-form article weekly.
- Rotate between commentary on industry news, case studies, and behind-the-scenes process breakdowns.
- End with a call-to-action inviting conversation (“DM me for the template”).

## 3. Showcase Rich Media
- Pin videos or Loom walkthroughs of your work.
- Upload templates or frameworks and gate them with a contact form to capture leads.

## 4. Engage with Key Hiring Managers
- Comment thoughtfully on posts from leaders in your target companies.
- Use Creator Analytics to see which posts triggered profile views and follow up with warm messages.

## 5. Track Conversion Metrics
- Use a simple spreadsheet to log inbound messages, interviews, and offer stages generated from LinkedIn content.
- Iterate topics based on what drives the most outreach.

Done consistently, Creator Mode turns your profile into a personal landing page that runs while you sleep.`,
    category: "Networking",
    tags: ["linkedin", "personal branding", "creator mode"],
    featuredImage:
      "https://images.pexels.com/photos/3184300/pexels-photo-3184300.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "LinkedIn Creator Mode for Job Seekers",
    seoDescription:
      "Harness LinkedIn Creator Mode to build authority, attract recruiters, and convert content into opportunities.",
    metaKeywords: ["linkedin creator mode", "personal branding", "job search"],
    publishedAt: "2025-01-21T08:15:00Z",
  },
  {
    title: "Visa-Friendly Countries for Tech Talent in 2025",
    excerpt:
      "Compare global visa pathways, processing times, and job market momentum to choose your next relocation.",
    content: `# Visa-Friendly Countries for Tech Talent in 2025

Deciding where to relocate can feel overwhelming. These countries balance visa support with strong tech ecosystems this year.

## 1. Canada – Global Talent Stream
- Processing time: ~2 weeks once employer is approved.
- Best for: Software engineers, product managers, data scientists.
- Perks: Pathway to permanent residency within 12-18 months.

## 2. United Kingdom – Scale-up & Global Talent Visas
- Processing time: 3-8 weeks.
- Best for: Leadership-level professionals with proven impact.
- Perks: Fast-tracked settlement and access to Europe-based teams.

## 3. Germany – EU Blue Card
- Processing time: 6-12 weeks.
- Best for: Engineers with STEM degrees and German offers above salary thresholds.
- Perks: Long-term residence and family reunification options.

## 4. United Arab Emirates – Golden Visa
- Processing time: 4-8 weeks.
- Best for: Entrepreneurs and highly compensated professionals.
- Perks: 10-year residency, no income tax, thriving startup hubs in Dubai and Abu Dhabi.

## 5. Portugal – Tech Visa
- Processing time: 60-90 days.
- Best for: Senior tech talent joining certified companies.
- Perks: Path to citizenship after five years and vibrant digital nomad communities.

Before committing, review cost of living, language requirements, and the stability of the visa route. Diversify your applications across multiple regions to maximize success.`,
    category: "Global Mobility",
    tags: ["visa options", "relocation", "tech talent"],
    featuredImage:
      "https://images.pexels.com/photos/3184433/pexels-photo-3184433.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Top Visa-Friendly Countries for Tech Talent",
    seoDescription:
      "Evaluate fast-moving visa programs in Canada, the UK, Germany, UAE, and Portugal to plan your 2025 relocation.",
    metaKeywords: ["visa friendly countries", "tech relocation", "global mobility"],
    publishedAt: "2025-01-23T14:20:00Z",
  },
  {
    title: "The Ultimate Sponsorship Cover Letter Template",
    excerpt:
      "Structure your cover letter to answer employer concerns about timelines, costs, and cultural fit in under 300 words.",
    content: `# The Ultimate Sponsorship Cover Letter Template

Employers offering visa support want clarity, confidence, and speed. Use this template to deliver all three.

## Opening Paragraph: Personal Connection + Value Prop
Reference a company announcement, recent product milestone, or mission statement. Then articulate the value you bring in one sentence.

> Example: “When I read HireAll is expanding its AI-driven job matching, I knew my experience leading a similar launch at X Corp would help you scale responsibly.”

## Middle Paragraph: Proof of Impact + Remote Readiness
- Highlight a quantifiable achievement tied to the role’s KPIs.
- Mention remote collaboration successes, time zones covered, and async tools mastered.
- Address sponsorship directly: “I’ve previously relocated from Singapore to Berlin and understand the compliance process.”

## Final Paragraph: Call to Action
Offer one next step (“Happy to share my relocation timeline or connect you with references who’ve managed my onboarding.”) and sign off politely.

## Formatting Tips
- Keep it to 250-300 words.
- Use short paragraphs or bullet points for readability.
- Mirror the company’s tone—formal for enterprises, conversational for startups.

Tailor the template for each application by swapping the proof points and mission references.`,
    category: "Job Search",
    tags: ["cover letter", "sponsorship", "templates"],
    featuredImage:
      "https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Sponsorship Cover Letter Template",
    seoDescription:
      "Download a plug-and-play cover letter structure that answers employer sponsorship concerns quickly.",
    metaKeywords: ["cover letter template", "visa sponsorship", "job application"],
    publishedAt: "2025-01-25T16:40:00Z",
  },
  {
    title: "Preparing for International Panel Interviews",
    excerpt:
      "Handle multi-time-zone interviews with senior stakeholders by orchestrating logistics, cultural context, and follow-up discipline.",
    content: `# Preparing for International Panel Interviews

Panel interviews can feel intense, especially when attendees span continents and functions. Here’s how to show up confidently.

## 1. Map the Panel
- Request names, titles, and locations ahead of time.
- Research how each panelist contributes to the role—product, engineering, people ops, etc.
- Note potential cultural nuances (direct vs. indirect feedback styles).

## 2. Confirm Logistics Early
- Double-check time zones and meeting links.
- Test your audio/video setup and have a backup hotspot ready.
- Prepare concise intros since panel time is limited.

## 3. Structure Answers for Multiple Stakeholders
- Use the SHIP framework (Situation, Hindrance, Intervention, Progress).
- Tie each response back to the panelist’s focus area.
- Invite questions: “Does this align with how your team approaches launches?”

## 4. Ask Smart Questions
- Cover strategic topics (“How are you balancing global expansion with compliance?”).
- Ask culture-focused questions (“How does the team celebrate wins across regions?”).

## 5. Follow Up Thoughtfully
- Send a single recap email within 24 hours summarizing key takeaways and next steps.
- Attach any requested materials (case studies, portfolios).
- Express appreciation for the logistical coordination involved.

Preparation signals respect for everyone’s time and reduces cognitive load during the conversation.`,
    category: "Interview Prep",
    tags: ["panel interview", "international", "job search"],
    featuredImage:
      "https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "International Panel Interview Tips",
    seoDescription:
      "Master panel interviews with distributed teams using the SHIP framework, tailored questions, and meticulous logistics.",
    metaKeywords: ["panel interview", "international job search", "remote hiring"],
    publishedAt: "2025-01-27T09:50:00Z",
  },
  {
    title: "Building Professional References Across Borders",
    excerpt:
      "Collect endorsements that reassure global employers about your reliability, collaboration, and visa readiness.",
    content: `# Building Professional References Across Borders

Strong references close the trust gap when hiring internationally. Curate them proactively.

## 1. Diversify Your Reference Bench
- Include a direct manager, a cross-functional partner, and a mentee or junior teammate.
- For sponsorship-heavy roles, secure a reference familiar with your relocation performance.

## 2. Prep References with Context
- Share the job description and your latest resume.
- Outline key achievements you’d like them to reinforce.
- Provide talking points around remote collaboration or compliance if relevant.

## 3. Maintain Warm Relationships
- Check in quarterly with quick updates or helpful resources.
- Offer to reciprocate with LinkedIn recommendations or introductions.
- Thank them immediately after a reference check and share outcomes.

## 4. Capture Written Testimonials
- Add brief quotes to your portfolio or LinkedIn featured section.
- Keep a private doc of longer testimonials to attach to applications when allowed.

References are easier to secure when you’ve invested in relationships long before you need them.`,
    category: "Networking",
    tags: ["references", "career capital", "international"],
    featuredImage:
      "https://images.pexels.com/photos/3184403/pexels-photo-3184403.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "How to Build Global Professional References",
    seoDescription:
      "Create a diversified bench of references and keep them engaged so global employers trust your track record.",
    metaKeywords: ["professional references", "international career", "recommendations"],
    publishedAt: "2025-01-29T11:10:00Z",
  },
  {
    title: "Budgeting for Relocation: Hidden Costs to Plan For",
    excerpt:
      "Beyond flights and movers, factor in banking, housing gaps, and compliance fees so your relocation stays on track.",
    content: `# Budgeting for Relocation: Hidden Costs to Plan For

Sponsorship packages differ widely. Avoid surprises by budgeting for the often-overlooked expenses of moving countries.

## 1. Visa and Legal Fees
- Government filing costs, medical checks, and translation services.
- Attorney fees if your employer doesn’t cover them fully.

## 2. Travel and Temporary Housing
- Airbnb or hotel stays while searching for long-term rentals.
- Storage for belongings during the transition.
- Extra baggage or shipping fees.

## 3. Banking and Currency Setup
- International transfer fees and exchange rate spreads.
- Initial deposits for utilities and rental agreements.
- Employer reimbursement timelines (some repay after you land).

## 4. Everyday Essentials
- Buying home basics again (kitchenware, linens, adapters).
- Setting up phone plans and internet.
- Transportation passes while you wait for a vehicle.

## 5. Safety Nets
- Emergency fund to cover delays or unexpected paperwork issues.
- International health insurance until local coverage activates.

Create a relocation budget spreadsheet and compare it against your employer’s package. Negotiate for reimbursements where possible and keep receipts organized for taxes.`,
    category: "Relocation",
    tags: ["relocation budget", "visa", "moving abroad"],
    featuredImage:
      "https://images.pexels.com/photos/3184331/pexels-photo-3184331.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Relocation Budget Checklist",
    seoDescription:
      "Plan for hidden relocation costs—legal, housing, banking, and emergency buffers—to move countries without financial stress.",
    metaKeywords: ["relocation budget", "moving costs", "international relocation"],
    publishedAt: "2025-01-31T13:30:00Z",
  },
  {
    title: "Using AI to Personalize Job Applications at Scale",
    excerpt:
      "Combine AI writing tools with human insight to keep outreach tailored while applying to dozens of visa-friendly roles.",
    content: `# Using AI to Personalize Job Applications at Scale

AI can amplify your job search if you guide it with smart prompts and human judgment.

## 1. Build a Role Requirement Library
- Collect 10-15 job descriptions for your target title.
- Extract common skills, metrics, and language patterns.
- Feed this into your AI prompt as the baseline context.

## 2. Create Modular Prompts
- Draft segments for intro lines, achievement storytelling, and cultural add-ons.
- Ask the AI to suggest variations while maintaining your voice.

## 3. Layer in Human Research
- Spend 5 minutes per company gathering relevant news or product updates.
- Provide those facts to the AI so each cover letter feels specific.

## 4. Review for Authenticity
- Remove over-the-top claims or buzzwords.
- Ensure you can speak to every bullet point in an interview.

## 5. Track Results
- Tag each application by level of personalization and monitor callback rates.
- Adjust AI prompts based on what generates interviews.

AI should handle the heavy lifting of formatting and structure while you supply the insight that proves you’re the right hire.`,
    category: "Career Tools",
    tags: ["ai job search", "personalization", "automation"],
    featuredImage:
      "https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "AI-Powered Job Application Workflow",
    seoDescription:
      "Leverage AI tools to personalize resumes and cover letters quickly while maintaining authenticity and accuracy.",
    metaKeywords: ["ai job applications", "personalized outreach", "job automation"],
    publishedAt: "2025-02-02T15:45:00Z",
  },
  {
    title: "Time-Zone Management Strategies for Distributed Teams",
    excerpt:
      "Adopt scheduling, async documentation, and meeting rituals that keep international projects moving without burnout.",
    content: `# Time-Zone Management Strategies for Distributed Teams

Working across time zones doesn’t need to drain your energy. These strategies keep collaboration smooth.

## 1. Establish Core Overlap Windows
- Agree on 2-3 hours of overlap for critical syncs.
- Rotate inconvenient meeting times quarterly so no single region suffers.

## 2. Lean on Async Rituals
- Share daily standups in Slack threads or recorded Loom updates.
- Document decisions and action items in a central hub (Notion, Confluence).
- Use comment features instead of pinging teammates at odd hours.

## 3. Automate Scheduling
- Use tools like Reclaim or Clockwise to suggest meeting times based on everyone’s working hours.
- Block “deep work” windows and mark them visible on calendars.

## 4. Communicate Expectations
- Clarify response time norms (e.g., 24 hours for non-urgent messages).
- Label requests clearly: [FYI], [Action Needed], [Urgent].
- Encourage people to snooze notifications outside their schedule.

## 5. Celebrate Across Regions
- Host virtual socials at rotating times.
- Record company-wide announcements for asynchronous viewing.
- Recognize achievements in public channels.

Respecting time zones builds trust and keeps teams engaged long-term.`,
    category: "Remote Work",
    tags: ["time zones", "remote collaboration", "async work"],
    featuredImage:
      "https://images.pexels.com/photos/3861967/pexels-photo-3861967.jpeg?auto=compress&cs=tinysrgb&w=1200",
    status: "published",
    seoTitle: "Time-Zone Management for Remote Teams",
    seoDescription:
      "Coordinate distributed teams with async rituals, rotating overlap hours, and clear communication norms.",
    metaKeywords: ["time zone management", "remote team", "async collaboration"],
    publishedAt: "2025-02-04T07:25:00Z",
  },
];

async function upsertPost(post) {
  const slug = post.slug ? slugify(post.slug) : slugify(post.title);
  const postsRef = db.collection("blogPosts");
  const existing = await postsRef.where("slug", "==", slug).limit(1).get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const basePayload = {
    title: post.title,
    slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    tags: Array.isArray(post.tags) ? post.tags : [],
    status: post.status || "draft",
    featuredImage: post.featuredImage || "",
    readingTime: post.readingTime || estimateReadingTime(post.content || ""),
    viewCount: post.viewCount ?? 0,
    likeCount: post.likeCount ?? 0,
    seoTitle: post.seoTitle || post.title,
    seoDescription: post.seoDescription || post.excerpt,
    metaKeywords: post.metaKeywords || [],
    author: {
      id: author.id,
      name: author.name,
      email: author.email,
    },
  };

  if (post.publishedAt) {
    basePayload.publishedAt = toTimestamp(post.publishedAt);
  } else if (basePayload.status === "published") {
    basePayload.publishedAt = now;
  } else {
    basePayload.publishedAt = null;
  }

  const updatedData = {
    ...basePayload,
    updatedAt: now,
  };

  if (existing.empty) {
    const createdData = {
      ...updatedData,
      createdAt: post.createdAt ? toTimestamp(post.createdAt) : now,
    };
    const docRef = await postsRef.add(createdData);
    return { action: "created", id: docRef.id, slug };
  }

  const existingDoc = existing.docs[0];
  const currentData = existingDoc.data();

  // Preserve original createdAt if present
  if (currentData.createdAt) {
    updatedData.createdAt = currentData.createdAt;
  } else {
    updatedData.createdAt = post.createdAt ? toTimestamp(post.createdAt) : now;
  }

  await existingDoc.ref.set(updatedData, { merge: true });
  return { action: "updated", id: existingDoc.id, slug };
}

async function main() {
  console.log("🚀 Seeding blog posts to Firestore project:", projectId);
  console.log("👤 Author:", author);
  console.log("🪪 Service account:", serviceAccountPath);

  const results = [];
  for (const post of posts) {
    try {
      const result = await upsertPost(post);
      console.log(`   ✅ ${result.action.toUpperCase()} - ${post.title} (slug: ${result.slug})`);
      results.push(result);
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`   ❌ Failed to upsert "${post.title}":`, error.message);
      results.push({ action: "failed", title: post.title, error: error.message });
    }
  }

  console.log("\n🎉 Seed complete. Summary: ");
  const summary = results.reduce(
    (acc, item) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    },
    {}
  );
  console.table(summary);

  const createdSlugs = results
    .filter((item) => item.action === "created" || item.action === "updated")
    .map((item) => item.slug);

  if (createdSlugs.length) {
    console.log("\n🔗 Seeded slugs:");
    createdSlugs.forEach((slug) => console.log(` - ${slug}`));
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("💥 Seed script failed:", error);
  process.exit(1);
});
