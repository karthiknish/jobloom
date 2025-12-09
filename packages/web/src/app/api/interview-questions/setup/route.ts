import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, isUserAdmin, getAdminDb } from "@/firebase/admin";

// Industry types
const INDUSTRIES = [
  "general",
  "technology",
  "finance",
  "healthcare",
  "marketing",
  "consulting",
  "data-science",
] as const;

type Industry = (typeof INDUSTRIES)[number];

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  tips: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  type: string;
  industry: Industry;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(decodedToken.uid);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const db = getAdminDb();
    const batch = db.batch();
    let questionCount = 0;

    // Comprehensive interview questions with industry field
    const interviewQuestions: Record<string, InterviewQuestion[]> = {
      behavioral: [
        // General behavioral questions
        {
          id: "b1",
          question: "Tell me about a time when you faced a challenging situation at work. How did you handle it?",
          category: "Problem Solving",
          tips: [
            "Use the STAR method (Situation, Task, Action, Result)",
            "Focus on your individual contribution",
            "Show how you learned from the experience",
          ],
          difficulty: "Medium",
          tags: ["problem-solving", "leadership", "resilience"],
          type: "behavioral",
          industry: "general",
        },
        {
          id: "b2",
          question: "Describe a time when you had to work with a difficult team member.",
          category: "Teamwork",
          tips: [
            "Stay professional and focus on facts",
            "Highlight communication and conflict resolution skills",
            "Show empathy and understanding",
          ],
          difficulty: "Medium",
          tags: ["teamwork", "communication", "conflict-resolution"],
          type: "behavioral",
          industry: "general",
        },
        {
          id: "b3",
          question: "Give an example of a goal you set and how you achieved it.",
          category: "Achievement",
          tips: [
            "Quantify your results when possible",
            "Explain the steps you took to achieve the goal",
            "Connect it to the role you're applying for",
          ],
          difficulty: "Easy",
          tags: ["achievement", "goal-setting", "planning"],
          type: "behavioral",
          industry: "general",
        },
        {
          id: "b4",
          question: "Tell me about a time when you failed. How did you handle it?",
          category: "Failure & Learning",
          tips: [
            "Choose a professional failure, not personal",
            "Focus on what you learned and how you improved",
            "Show accountability and growth mindset",
          ],
          difficulty: "Medium",
          tags: ["failure", "learning", "growth", "accountability"],
          type: "behavioral",
          industry: "general",
        },
        {
          id: "b5",
          question: "Describe a situation where you had to learn something new quickly.",
          category: "Adaptability",
          tips: [
            "Explain your learning process",
            "Show how you applied new knowledge",
            "Connect to the role's requirements",
          ],
          difficulty: "Easy",
          tags: ["learning", "adaptability", "growth"],
          type: "behavioral",
          industry: "general",
        },
        // Technology-specific behavioral
        {
          id: "b6",
          question: "Tell me about a time when you had to debug a critical production issue under pressure.",
          category: "Problem Solving",
          tips: [
            "Explain your debugging methodology",
            "Highlight collaboration with team",
            "Mention preventive measures taken afterward",
          ],
          difficulty: "Hard",
          tags: ["debugging", "pressure", "problem-solving"],
          type: "behavioral",
          industry: "technology",
        },
        {
          id: "b7",
          question: "Describe a time when you had to push back on technical requirements.",
          category: "Communication",
          tips: [
            "Show how you presented alternatives",
            "Demonstrate stakeholder management",
            "Focus on outcomes achieved",
          ],
          difficulty: "Medium",
          tags: ["communication", "stakeholder-management", "negotiation"],
          type: "behavioral",
          industry: "technology",
        },
        // Finance-specific behavioral
        {
          id: "b8",
          question: "Tell me about a time when you identified a significant financial discrepancy.",
          category: "Attention to Detail",
          tips: [
            "Explain your discovery process",
            "Show the impact of your finding",
            "Highlight compliance considerations",
          ],
          difficulty: "Medium",
          tags: ["attention-to-detail", "compliance", "analysis"],
          type: "behavioral",
          industry: "finance",
        },
        {
          id: "b9",
          question: "Describe a situation where you had to make a quick decision with limited data.",
          category: "Decision Making",
          tips: [
            "Explain your risk assessment approach",
            "Show how you managed uncertainty",
            "Discuss the outcome and learnings",
          ],
          difficulty: "Hard",
          tags: ["decision-making", "risk-management", "analysis"],
          type: "behavioral",
          industry: "finance",
        },
        // Healthcare-specific behavioral
        {
          id: "b10",
          question: "Tell me about a time when you had to handle a difficult patient or family situation.",
          category: "Patient Care",
          tips: [
            "Show empathy and professionalism",
            "Explain your communication approach",
            "Focus on patient outcomes",
          ],
          difficulty: "Medium",
          tags: ["patient-care", "communication", "empathy"],
          type: "behavioral",
          industry: "healthcare",
        },
        {
          id: "b11",
          question: "Describe a situation where you identified a potential safety concern.",
          category: "Safety",
          tips: [
            "Explain your observation and assessment",
            "Show how you escalated appropriately",
            "Highlight preventive actions taken",
          ],
          difficulty: "Medium",
          tags: ["safety", "compliance", "attention-to-detail"],
          type: "behavioral",
          industry: "healthcare",
        },
        // Marketing-specific behavioral
        {
          id: "b12",
          question: "Tell me about a campaign that didn't perform as expected. What did you learn?",
          category: "Campaign Analysis",
          tips: [
            "Be honest about what went wrong",
            "Show your analytical approach",
            "Explain improvements made afterward",
          ],
          difficulty: "Medium",
          tags: ["campaign-analysis", "learning", "marketing"],
          type: "behavioral",
          industry: "marketing",
        },
        {
          id: "b13",
          question: "Describe a time when you had to pivot a marketing strategy mid-campaign.",
          category: "Adaptability",
          tips: [
            "Explain the signals that triggered the pivot",
            "Show quick decision-making",
            "Highlight the results of the change",
          ],
          difficulty: "Medium",
          tags: ["adaptability", "strategy", "decision-making"],
          type: "behavioral",
          industry: "marketing",
        },
        // Consulting-specific behavioral
        {
          id: "b14",
          question: "Tell me about a time when you had to manage multiple client expectations.",
          category: "Client Management",
          tips: [
            "Show prioritization skills",
            "Explain your communication strategy",
            "Focus on client satisfaction outcomes",
          ],
          difficulty: "Hard",
          tags: ["client-management", "prioritization", "communication"],
          type: "behavioral",
          industry: "consulting",
        },
        {
          id: "b15",
          question: "Describe a situation where you had to deliver bad news to a client.",
          category: "Communication",
          tips: [
            "Show empathy and professionalism",
            "Explain how you prepared solutions",
            "Focus on maintaining the relationship",
          ],
          difficulty: "Hard",
          tags: ["communication", "client-management", "problem-solving"],
          type: "behavioral",
          industry: "consulting",
        },
        // Data Science-specific behavioral
        {
          id: "b16",
          question: "Tell me about a time when your analysis led to a significant business decision.",
          category: "Business Impact",
          tips: [
            "Quantify the business impact",
            "Explain your methodology",
            "Show stakeholder communication",
          ],
          difficulty: "Medium",
          tags: ["business-impact", "analysis", "communication"],
          type: "behavioral",
          industry: "data-science",
        },
        {
          id: "b17",
          question: "Describe a situation where you had to explain complex technical findings to non-technical stakeholders.",
          category: "Communication",
          tips: [
            "Show your storytelling approach",
            "Explain visualization techniques used",
            "Focus on actionable insights",
          ],
          difficulty: "Medium",
          tags: ["communication", "stakeholder-management", "storytelling"],
          type: "behavioral",
          industry: "data-science",
        },
      ],
      technical: [
        // Technology-specific technical
        {
          id: "t1",
          question: "Explain the difference between let, const, and var in JavaScript.",
          category: "JavaScript",
          tips: [
            "Explain scope differences",
            "Mention hoisting behavior",
            "Give practical examples",
          ],
          difficulty: "Easy",
          tags: ["javascript", "variables", "scope"],
          type: "technical",
          industry: "technology",
        },
        {
          id: "t2",
          question: "How do you optimize a React application's performance?",
          category: "React",
          tips: [
            "Use React.memo, useMemo, and useCallback",
            "Implement code splitting and lazy loading",
            "Optimize bundle size and loading strategies",
          ],
          difficulty: "Medium",
          tags: ["react", "performance", "optimization"],
          type: "technical",
          industry: "technology",
        },
        {
          id: "t3",
          question: "What is the difference between SQL and NoSQL databases?",
          category: "Databases",
          tips: [
            "Explain when to use each type",
            "Discuss scalability and flexibility",
            "Mention specific use cases",
          ],
          difficulty: "Medium",
          tags: ["databases", "sql", "nosql", "architecture"],
          type: "technical",
          industry: "technology",
        },
        {
          id: "t4",
          question: "Explain RESTful API design principles.",
          category: "API Design",
          tips: [
            "Cover HTTP methods and status codes",
            "Explain resource naming and endpoints",
            "Discuss statelessness and caching",
          ],
          difficulty: "Medium",
          tags: ["api", "rest", "design", "architecture"],
          type: "technical",
          industry: "technology",
        },
        {
          id: "t5",
          question: "How do you approach debugging a complex issue?",
          category: "Debugging",
          tips: [
            "Explain your systematic approach",
            "Mention tools and techniques you use",
            "Show how you isolate and solve problems",
          ],
          difficulty: "Medium",
          tags: ["debugging", "problem-solving", "tools"],
          type: "technical",
          industry: "technology",
        },
        {
          id: "t6",
          question: "Explain microservices architecture and its trade-offs.",
          category: "Architecture",
          tips: [
            "Compare with monolithic architecture",
            "Discuss scaling benefits and complexity costs",
            "Mention communication patterns",
          ],
          difficulty: "Hard",
          tags: ["microservices", "architecture", "scaling"],
          type: "technical",
          industry: "technology",
        },
        // Finance-specific technical
        {
          id: "t7",
          question: "Walk me through how you would build a DCF model.",
          category: "Financial Modeling",
          tips: [
            "Explain WACC calculation",
            "Discuss cash flow projections",
            "Cover terminal value approaches",
          ],
          difficulty: "Hard",
          tags: ["dcf", "valuation", "financial-modeling"],
          type: "technical",
          industry: "finance",
        },
        {
          id: "t8",
          question: "How would you assess the credit risk of a company?",
          category: "Credit Analysis",
          tips: [
            "Cover financial ratios",
            "Discuss industry factors",
            "Mention qualitative assessments",
          ],
          difficulty: "Medium",
          tags: ["credit-risk", "analysis", "ratios"],
          type: "technical",
          industry: "finance",
        },
        {
          id: "t9",
          question: "Explain the Black-Scholes option pricing model.",
          category: "Derivatives",
          tips: [
            "Cover the key inputs",
            "Explain assumptions and limitations",
            "Discuss practical applications",
          ],
          difficulty: "Hard",
          tags: ["options", "derivatives", "pricing"],
          type: "technical",
          industry: "finance",
        },
        // Healthcare-specific technical
        {
          id: "t10",
          question: "How do you ensure HIPAA compliance in healthcare IT systems?",
          category: "Compliance",
          tips: [
            "Cover PHI protection requirements",
            "Discuss access controls",
            "Mention audit and monitoring",
          ],
          difficulty: "Medium",
          tags: ["hipaa", "compliance", "security"],
          type: "technical",
          industry: "healthcare",
        },
        {
          id: "t11",
          question: "Explain the difference between ICD-10 and CPT codes.",
          category: "Medical Coding",
          tips: [
            "Cover diagnosis vs procedure coding",
            "Explain use cases for each",
            "Mention billing implications",
          ],
          difficulty: "Easy",
          tags: ["medical-coding", "icd-10", "cpt"],
          type: "technical",
          industry: "healthcare",
        },
        // Marketing-specific technical
        {
          id: "t12",
          question: "How would you set up a multi-touch attribution model?",
          category: "Marketing Analytics",
          tips: [
            "Compare different attribution models",
            "Discuss data requirements",
            "Cover implementation challenges",
          ],
          difficulty: "Hard",
          tags: ["attribution", "analytics", "marketing"],
          type: "technical",
          industry: "marketing",
        },
        {
          id: "t13",
          question: "Explain how you would optimize a Google Ads campaign.",
          category: "Digital Marketing",
          tips: [
            "Cover keyword strategy",
            "Discuss bidding approaches",
            "Mention quality score optimization",
          ],
          difficulty: "Medium",
          tags: ["google-ads", "ppc", "optimization"],
          type: "technical",
          industry: "marketing",
        },
        // Data Science-specific technical
        {
          id: "t14",
          question: "Explain the difference between supervised and unsupervised learning.",
          category: "Machine Learning",
          tips: [
            "Give examples of each",
            "Discuss when to use each approach",
            "Cover common algorithms",
          ],
          difficulty: "Easy",
          tags: ["machine-learning", "supervised", "unsupervised"],
          type: "technical",
          industry: "data-science",
        },
        {
          id: "t15",
          question: "How do you handle imbalanced datasets?",
          category: "Data Processing",
          tips: [
            "Cover sampling techniques",
            "Discuss algorithm selection",
            "Mention evaluation metrics",
          ],
          difficulty: "Medium",
          tags: ["imbalanced-data", "sampling", "machine-learning"],
          type: "technical",
          industry: "data-science",
        },
        {
          id: "t16",
          question: "Explain the bias-variance tradeoff.",
          category: "Machine Learning",
          tips: [
            "Define both concepts clearly",
            "Discuss their relationship",
            "Show how to balance them",
          ],
          difficulty: "Medium",
          tags: ["bias", "variance", "overfitting", "machine-learning"],
          type: "technical",
          industry: "data-science",
        },
        {
          id: "t17",
          question: "How would you design an A/B test for a new feature?",
          category: "Experimentation",
          tips: [
            "Cover hypothesis formulation",
            "Discuss sample size calculation",
            "Explain statistical significance",
          ],
          difficulty: "Medium",
          tags: ["ab-testing", "experimentation", "statistics"],
          type: "technical",
          industry: "data-science",
        },
        // Consulting-specific technical
        {
          id: "t18",
          question: "Walk me through a market sizing analysis.",
          category: "Market Analysis",
          tips: [
            "Cover top-down and bottom-up approaches",
            "Explain key assumptions",
            "Show sensitivity analysis",
          ],
          difficulty: "Medium",
          tags: ["market-sizing", "analysis", "strategy"],
          type: "technical",
          industry: "consulting",
        },
        {
          id: "t19",
          question: "How would you structure a profitability analysis?",
          category: "Business Analysis",
          tips: [
            "Break down revenue and cost drivers",
            "Use issue trees",
            "Focus on actionable insights",
          ],
          difficulty: "Medium",
          tags: ["profitability", "analysis", "strategy"],
          type: "technical",
          industry: "consulting",
        },
      ],
      situational: [
        // General situational
        {
          id: "s1",
          question: "How would you handle a situation where a project deadline is approaching and you're falling behind?",
          category: "Project Management",
          tips: [
            "Communicate early with stakeholders",
            "Prioritize tasks and delegate when possible",
            "Focus on the most important deliverables",
          ],
          difficulty: "Medium",
          tags: ["project-management", "communication", "prioritization"],
          type: "situational",
          industry: "general",
        },
        {
          id: "s2",
          question: "If you were given a project with unclear requirements, how would you proceed?",
          category: "Requirements Gathering",
          tips: [
            "Ask clarifying questions",
            "Document assumptions and get sign-off",
            "Break down the problem into manageable pieces",
          ],
          difficulty: "Medium",
          tags: ["requirements", "communication", "planning"],
          type: "situational",
          industry: "general",
        },
        {
          id: "s3",
          question: "How would you handle a disagreement with your manager about project direction?",
          category: "Conflict Resolution",
          tips: [
            "Prepare data to support your position",
            "Listen to their perspective",
            "Find common ground or compromise",
          ],
          difficulty: "Hard",
          tags: ["conflict-resolution", "communication", "leadership"],
          type: "situational",
          industry: "general",
        },
        {
          id: "s4",
          question: "How would you prioritize tasks when everything seems equally important?",
          category: "Task Prioritization",
          tips: [
            "Consider deadlines and impact",
            "Use frameworks like Eisenhower Matrix",
            "Communicate priorities with stakeholders",
          ],
          difficulty: "Easy",
          tags: ["prioritization", "time-management", "decision-making"],
          type: "situational",
          industry: "general",
        },
        // Technology-specific situational
        {
          id: "s5",
          question: "If you discovered a critical security vulnerability in production, what would you do?",
          category: "Security",
          tips: [
            "Assess severity and impact immediately",
            "Follow incident response procedures",
            "Balance speed with thoroughness",
          ],
          difficulty: "Hard",
          tags: ["security", "incident-response", "crisis-management"],
          type: "situational",
          industry: "technology",
        },
        {
          id: "s6",
          question: "How would you handle a situation where a junior developer's code is slowing down the team?",
          category: "Team Management",
          tips: [
            "Approach with mentorship mindset",
            "Provide constructive feedback",
            "Create improvement plan",
          ],
          difficulty: "Medium",
          tags: ["mentoring", "code-review", "team-management"],
          type: "situational",
          industry: "technology",
        },
        // Finance-specific situational
        {
          id: "s7",
          question: "If you found an error in a financial report that's already been submitted, what would you do?",
          category: "Compliance",
          tips: [
            "Assess materiality of the error",
            "Follow proper escalation procedures",
            "Document everything",
          ],
          difficulty: "Hard",
          tags: ["compliance", "error-handling", "communication"],
          type: "situational",
          industry: "finance",
        },
        {
          id: "s8",
          question: "How would you handle a client requesting an aggressive valuation?",
          category: "Client Management",
          tips: [
            "Maintain professional integrity",
            "Explain methodology and limitations",
            "Propose alternatives within bounds",
          ],
          difficulty: "Hard",
          tags: ["client-management", "integrity", "valuation"],
          type: "situational",
          industry: "finance",
        },
        // Healthcare-specific situational
        {
          id: "s9",
          question: "How would you handle a situation where a physician disagrees with your recommendation?",
          category: "Collaboration",
          tips: [
            "Present evidence-based rationale",
            "Listen to their clinical perspective",
            "Focus on patient outcomes",
          ],
          difficulty: "Medium",
          tags: ["collaboration", "communication", "patient-care"],
          type: "situational",
          industry: "healthcare",
        },
        // Consulting-specific situational
        {
          id: "s10",
          question: "How would you handle a client who keeps changing project scope?",
          category: "Client Management",
          tips: [
            "Document scope changes formally",
            "Communicate impact on timeline and budget",
            "Maintain positive relationship",
          ],
          difficulty: "Medium",
          tags: ["scope-management", "client-management", "communication"],
          type: "situational",
          industry: "consulting",
        },
      ],
      leadership: [
        // General leadership
        {
          id: "l1",
          question: "Tell me about a time when you led a team through a challenging project.",
          category: "Team Leadership",
          tips: [
            "Describe your leadership style",
            "Show how you motivated and guided the team",
            "Quantify the success achieved",
          ],
          difficulty: "Hard",
          tags: ["leadership", "team-management", "project-delivery"],
          type: "leadership",
          industry: "general",
        },
        {
          id: "l2",
          question: "How do you motivate team members who seem disengaged?",
          category: "Motivation",
          tips: [
            "Understand individual motivations",
            "Provide clear goals and feedback",
            "Recognize achievements and contributions",
          ],
          difficulty: "Medium",
          tags: ["motivation", "leadership", "team-building"],
          type: "leadership",
          industry: "general",
        },
        {
          id: "l3",
          question: "Describe how you handle performance issues with a team member.",
          category: "Performance Management",
          tips: [
            "Address issues promptly and privately",
            "Provide specific feedback and examples",
            "Create improvement plans with clear goals",
          ],
          difficulty: "Hard",
          tags: ["performance-management", "feedback", "leadership"],
          type: "leadership",
          industry: "general",
        },
        {
          id: "l4",
          question: "How do you balance technical work with leadership responsibilities?",
          category: "Work-Life Balance",
          tips: [
            "Delegate effectively",
            "Set boundaries and priorities",
            "Develop your team's capabilities",
          ],
          difficulty: "Medium",
          tags: ["leadership", "balance", "delegation"],
          type: "leadership",
          industry: "general",
        },
        // Technology-specific leadership
        {
          id: "l5",
          question: "How do you drive technical decisions in a team with diverse opinions?",
          category: "Technical Leadership",
          tips: [
            "Create structured decision frameworks",
            "Encourage data-driven discussions",
            "Build consensus while making timely decisions",
          ],
          difficulty: "Hard",
          tags: ["technical-leadership", "decision-making", "consensus"],
          type: "leadership",
          industry: "technology",
        },
      ],
      systemDesign: [
        // Technology-specific system design
        {
          id: "sd1",
          question: "How would you design a URL shortening service like bit.ly?",
          category: "System Design",
          tips: [
            "Consider scalability and performance",
            "Think about data storage and retrieval",
            "Address edge cases and error handling",
          ],
          difficulty: "Hard",
          tags: ["system-design", "scalability", "architecture"],
          type: "systemDesign",
          industry: "technology",
        },
        {
          id: "sd2",
          question: "Design a notification system for a social media platform.",
          category: "System Design",
          tips: [
            "Consider different types of notifications",
            "Think about real-time delivery vs. batching",
            "Address user preferences and filtering",
          ],
          difficulty: "Hard",
          tags: ["system-design", "real-time", "scalability"],
          type: "systemDesign",
          industry: "technology",
        },
        {
          id: "sd3",
          question: "How would you design a rate limiting system?",
          category: "System Design",
          tips: [
            "Discuss different algorithms (token bucket, sliding window)",
            "Consider distributed scenarios",
            "Address edge cases",
          ],
          difficulty: "Hard",
          tags: ["system-design", "rate-limiting", "distributed-systems"],
          type: "systemDesign",
          industry: "technology",
        },
        {
          id: "sd4",
          question: "Design a real-time chat application.",
          category: "System Design",
          tips: [
            "Consider WebSocket vs polling",
            "Address message delivery guarantees",
            "Think about scaling for millions of users",
          ],
          difficulty: "Hard",
          tags: ["system-design", "real-time", "chat", "websocket"],
          type: "systemDesign",
          industry: "technology",
        },
      ],
      productSense: [
        // General product sense
        {
          id: "ps1",
          question: "How would you improve the user experience of a product you're familiar with?",
          category: "Product Thinking",
          tips: [
            "Identify pain points and user needs",
            "Propose specific, actionable improvements",
            "Consider technical feasibility and business impact",
          ],
          difficulty: "Medium",
          tags: ["product-thinking", "ux", "improvement"],
          type: "productSense",
          industry: "general",
        },
        {
          id: "ps2",
          question: "How do you prioritize features for a new product release?",
          category: "Product Management",
          tips: [
            "Use frameworks like MoSCoW or RICE scoring",
            "Consider user value, business impact, and effort",
            "Balance short-term wins with long-term vision",
          ],
          difficulty: "Medium",
          tags: ["product-management", "prioritization", "strategy"],
          type: "productSense",
          industry: "general",
        },
        // Technology product sense
        {
          id: "ps3",
          question: "How would you measure the success of a new API feature?",
          category: "Product Metrics",
          tips: [
            "Define adoption and usage metrics",
            "Consider developer experience indicators",
            "Track error rates and performance",
          ],
          difficulty: "Medium",
          tags: ["metrics", "api", "product-management"],
          type: "productSense",
          industry: "technology",
        },
        // Marketing product sense
        {
          id: "ps4",
          question: "How would you approach launching a product in a new market?",
          category: "Go-to-Market",
          tips: [
            "Research market dynamics and competition",
            "Define target segments and positioning",
            "Plan channel strategy and messaging",
          ],
          difficulty: "Hard",
          tags: ["go-to-market", "strategy", "launch"],
          type: "productSense",
          industry: "marketing",
        },
      ],
    };

    // Save all questions to Firebase
    for (const [type, questions] of Object.entries(interviewQuestions)) {
      for (const question of questions) {
        const questionRef = db.collection("interviewQuestions").doc(question.id);
        batch.set(questionRef, {
          ...question,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        questionCount++;
      }
    }

    // Commit the batch
    await batch.commit();

    // Count by industry
    const industryCounts: Record<string, number> = {};
    for (const questions of Object.values(interviewQuestions)) {
      for (const q of questions) {
        industryCounts[q.industry] = (industryCounts[q.industry] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${questionCount} interview questions to Firebase`,
      data: {
        totalQuestions: questionCount,
        categories: Object.keys(interviewQuestions),
        industries: INDUSTRIES,
        questionsByIndustry: industryCounts,
      },
    });
  } catch (error) {
    console.error("Error saving interview questions:", error);
    return NextResponse.json(
      { error: "Failed to save interview questions" },
      { status: 500 }
    );
  }
}
