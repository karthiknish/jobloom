import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";
import { getAdminDb } from "@/firebase/admin";

// Comprehensive interview questions data for seeding/fallback
const defaultInterviewQuestions = {
  behavioral: [
    {
      id: "beh-1",
      question: "Tell me about a time when you faced a challenging situation at work. How did you handle it?",
      category: "Problem Solving",
      tips: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Focus on your individual contribution",
        "Show how you learned from the experience",
        "Quantify results when possible"
      ],
      difficulty: "Medium",
      tags: ["problem-solving", "leadership", "resilience"],
      type: "behavioral",
    },
    {
      id: "beh-2",
      question: "Describe a time when you had to work with a difficult team member. How did you manage the situation?",
      category: "Teamwork",
      tips: [
        "Stay professional and focus on facts",
        "Highlight communication and conflict resolution skills",
        "Show empathy and understanding",
        "Explain the positive outcome"
      ],
      difficulty: "Medium",
      tags: ["teamwork", "communication", "conflict-resolution"],
      type: "behavioral",
    },
    {
      id: "beh-3",
      question: "Give me an example of a goal you set and how you achieved it.",
      category: "Goal Setting",
      tips: [
        "Choose a meaningful, measurable goal",
        "Describe your planning process",
        "Highlight obstacles you overcame",
        "Share the tangible results"
      ],
      difficulty: "Easy",
      tags: ["goal-setting", "achievement", "planning"],
      type: "behavioral",
    },
    {
      id: "beh-4",
      question: "Tell me about a time you failed. What did you learn from it?",
      category: "Self-Awareness",
      tips: [
        "Be honest about the failure",
        "Take ownership - don't blame others",
        "Focus on the lessons learned",
        "Explain how you've applied those lessons"
      ],
      difficulty: "Hard",
      tags: ["failure", "growth-mindset", "self-awareness"],
      type: "behavioral",
    },
    {
      id: "beh-5",
      question: "Describe a situation where you had to adapt to a significant change.",
      category: "Adaptability",
      tips: [
        "Show flexibility and positive attitude",
        "Describe specific actions you took",
        "Highlight any leadership during the transition",
        "Share the successful outcome"
      ],
      difficulty: "Medium",
      tags: ["adaptability", "change-management", "flexibility"],
      type: "behavioral",
    }
  ],
  technical: [
    {
      id: "tech-1",
      question: "Explain the difference between let, const, and var in JavaScript.",
      category: "JavaScript",
      tips: [
        "Explain scope differences (block vs function)",
        "Mention hoisting behavior",
        "Discuss temporal dead zone",
        "Give practical examples of when to use each"
      ],
      difficulty: "Easy",
      tags: ["javascript", "variables", "scope"],
      type: "technical",
    },
    {
      id: "tech-2",
      question: "What is the difference between REST and GraphQL? When would you use each?",
      category: "API Design",
      tips: [
        "Explain the key differences in architecture",
        "Discuss over-fetching and under-fetching",
        "Mention use cases for each",
        "Talk about versioning and flexibility"
      ],
      difficulty: "Medium",
      tags: ["api", "rest", "graphql", "architecture"],
      type: "technical",
    },
    {
      id: "tech-3",
      question: "Explain the concept of closures in JavaScript with an example.",
      category: "JavaScript",
      tips: [
        "Define what a closure is",
        "Explain lexical scope",
        "Provide a practical example",
        "Mention common use cases like data privacy"
      ],
      difficulty: "Medium",
      tags: ["javascript", "closures", "scope"],
      type: "technical",
    },
    {
      id: "tech-4",
      question: "How would you optimize a slow database query?",
      category: "Database",
      tips: [
        "Start with query analysis (EXPLAIN)",
        "Discuss indexing strategies",
        "Mention query restructuring",
        "Talk about caching and denormalization"
      ],
      difficulty: "Hard",
      tags: ["database", "performance", "optimization"],
      type: "technical",
    },
    {
      id: "tech-5",
      question: "What is the event loop in JavaScript and how does it work?",
      category: "JavaScript",
      tips: [
        "Explain call stack, task queue, and event loop",
        "Discuss microtasks vs macrotasks",
        "Mention blocking vs non-blocking operations",
        "Give an example with setTimeout"
      ],
      difficulty: "Hard",
      tags: ["javascript", "event-loop", "async"],
      type: "technical",
    }
  ],
  situational: [
    {
      id: "sit-1",
      question: "How would you handle a situation where a project deadline is approaching and you're falling behind?",
      category: "Project Management",
      tips: [
        "Communicate early with stakeholders",
        "Prioritize tasks and delegate when possible",
        "Focus on the most important deliverables",
        "Propose realistic solutions"
      ],
      difficulty: "Medium",
      tags: ["project-management", "communication", "prioritization"],
      type: "situational",
    },
    {
      id: "sit-2",
      question: "A colleague takes credit for your work in a meeting. How would you handle this?",
      category: "Workplace Dynamics",
      tips: [
        "Stay calm and professional",
        "Address it directly but privately first",
        "Focus on facts, not emotions",
        "Document your contributions going forward"
      ],
      difficulty: "Hard",
      tags: ["workplace-dynamics", "communication", "conflict"],
      type: "situational",
    },
    {
      id: "sit-3",
      question: "Your manager assigns you a task that conflicts with your ethical values. What do you do?",
      category: "Ethics",
      tips: [
        "Clarify the request to ensure understanding",
        "Express concerns professionally",
        "Propose alternative solutions",
        "Know your company's escalation paths"
      ],
      difficulty: "Hard",
      tags: ["ethics", "values", "communication"],
      type: "situational",
    },
    {
      id: "sit-4",
      question: "You're given a project with unclear requirements. How would you proceed?",
      category: "Requirements Gathering",
      tips: [
        "Ask clarifying questions",
        "Document assumptions",
        "Create prototypes for feedback",
        "Establish regular check-ins"
      ],
      difficulty: "Medium",
      tags: ["requirements", "communication", "planning"],
      type: "situational",
    }
  ],
  leadership: [
    {
      id: "lead-1",
      question: "Tell me about a time when you led a team through a challenging project.",
      category: "Team Leadership",
      tips: [
        "Describe your leadership style",
        "Show how you motivated and guided the team",
        "Discuss challenges and how you addressed them",
        "Quantify the success achieved"
      ],
      difficulty: "Hard",
      tags: ["leadership", "team-management", "project-delivery"],
      type: "leadership",
    },
    {
      id: "lead-2",
      question: "How do you handle underperforming team members?",
      category: "Performance Management",
      tips: [
        "Focus on early identification",
        "Describe your feedback approach",
        "Mention support and development plans",
        "Discuss documentation and accountability"
      ],
      difficulty: "Hard",
      tags: ["performance-management", "feedback", "coaching"],
      type: "leadership",
    },
    {
      id: "lead-3",
      question: "Describe how you delegate tasks effectively.",
      category: "Delegation",
      tips: [
        "Match tasks to team members' strengths",
        "Provide clear expectations and context",
        "Set checkpoints without micromanaging",
        "Ensure team members feel empowered"
      ],
      difficulty: "Medium",
      tags: ["delegation", "empowerment", "management"],
      type: "leadership",
    },
    {
      id: "lead-4",
      question: "How do you build and maintain team morale?",
      category: "Team Culture",
      tips: [
        "Recognition and appreciation",
        "Foster open communication",
        "Create growth opportunities",
        "Balance workload and well-being"
      ],
      difficulty: "Medium",
      tags: ["team-culture", "morale", "leadership"],
      type: "leadership",
    }
  ],
  systemDesign: [
    {
      id: "sys-1",
      question: "How would you design a URL shortening service like bit.ly?",
      category: "System Design",
      tips: [
        "Consider scalability and performance",
        "Think about data storage and retrieval",
        "Address edge cases and error handling",
        "Discuss caching and CDN strategies"
      ],
      difficulty: "Hard",
      tags: ["system-design", "scalability", "architecture"],
      type: "systemDesign",
    },
    {
      id: "sys-2",
      question: "Design a real-time chat application like Slack.",
      category: "System Design",
      tips: [
        "Discuss WebSocket vs polling",
        "Address message storage and retrieval",
        "Consider offline support and sync",
        "Plan for scalability with many users"
      ],
      difficulty: "Hard",
      tags: ["real-time", "websocket", "distributed-systems"],
      type: "systemDesign",
    },
    {
      id: "sys-3",
      question: "How would you design a rate limiting system?",
      category: "System Design",
      tips: [
        "Explain different algorithms (token bucket, leaky bucket)",
        "Discuss distributed rate limiting",
        "Address edge cases",
        "Consider user experience impact"
      ],
      difficulty: "Medium",
      tags: ["rate-limiting", "api", "security"],
      type: "systemDesign",
    }
  ],
  productSense: [
    {
      id: "prod-1",
      question: "How would you improve the user experience of a product you're familiar with?",
      category: "Product Thinking",
      tips: [
        "Identify pain points and user needs",
        "Propose specific, actionable improvements",
        "Consider technical feasibility and business impact",
        "Prioritize based on user value"
      ],
      difficulty: "Medium",
      tags: ["product-thinking", "ux", "improvement"],
      type: "productSense",
    },
    {
      id: "prod-2",
      question: "How would you prioritize features for a new product launch?",
      category: "Product Strategy",
      tips: [
        "Define success metrics",
        "Consider user value vs effort",
        "Think about MVP and iteration",
        "Balance stakeholder interests"
      ],
      difficulty: "Hard",
      tags: ["prioritization", "product-strategy", "mvp"],
      type: "productSense",
    },
    {
      id: "prod-3",
      question: "How would you measure the success of a new feature?",
      category: "Metrics",
      tips: [
        "Define clear success criteria",
        "Choose relevant quantitative and qualitative metrics",
        "Set up proper tracking",
        "Plan for iteration based on data"
      ],
      difficulty: "Medium",
      tags: ["metrics", "analytics", "product-management"],
      type: "productSense",
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    // Verify session
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Try to fetch from Firestore first
    try {
      const db = getAdminDb();
      const snapshot = await db.collection("interviewQuestions").orderBy("id").get();

      if (!snapshot.empty) {
        // Organize questions by type
        const interviewQuestions: Record<string, any[]> = {
          behavioral: [],
          technical: [],
          situational: [],
          leadership: [],
          systemDesign: [],
          productSense: [],
        };

        snapshot.forEach((doc) => {
          const docData = doc.data() as { type?: string;[key: string]: unknown };
          const question = { id: doc.id, ...docData };
          const type = docData.type;
          if (type && interviewQuestions[type]) {
            interviewQuestions[type].push(question);
          }
        });

        // Check if we have meaningful data
        const totalQuestions = Object.values(interviewQuestions).reduce(
          (sum, arr) => sum + arr.length,
          0
        );

        if (totalQuestions > 0) {
          return NextResponse.json({
            success: true,
            data: interviewQuestions,
            source: "firestore",
            totalQuestions,
          });
        }
      }
    } catch (firestoreError) {
      console.warn("Firestore fetch failed, using fallback data:", firestoreError);
    }

    // Fallback to default questions
    const totalQuestions = Object.values(defaultInterviewQuestions).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    return NextResponse.json({
      success: true,
      data: defaultInterviewQuestions,
      source: "fallback",
      totalQuestions,
      message: "Using default questions. Run /api/interview-questions/setup to populate Firestore."
    });
  } catch (error) {
    console.error("Error fetching interview questions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch interview questions",
        code: "FETCH_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
