import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, isUserAdmin, getAdminDb } from "@/firebase/admin";

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

    // Interview questions data
    const interviewQuestions = {
      behavioral: [
        {
          id: "1",
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
        },
        {
          id: "2",
          question: "Describe a time when you had to work with a difficult team member. How did you manage the situation?",
          category: "Teamwork",
          tips: [
            "Stay professional and focus on facts",
            "Highlight communication and conflict resolution skills",
            "Show empathy and understanding",
          ],
          difficulty: "Medium",
          tags: ["teamwork", "communication", "conflict-resolution"],
          type: "behavioral",
        },
        {
          id: "3",
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
        },
        {
          id: "4",
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
        },
        {
          id: "5",
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
        },
        {
          id: "6",
          question: "Tell me about a time when you had to make a difficult decision.",
          category: "Decision Making",
          tips: [
            "Explain your thought process",
            "Consider alternatives you explored",
            "Show how you evaluated options",
          ],
          difficulty: "Medium",
          tags: ["decision-making", "analysis", "leadership"],
          type: "behavioral",
        },
        {
          id: "7",
          question: "Describe a time when you went above and beyond for a customer/client.",
          category: "Customer Service",
          tips: [
            "Quantify the impact of your actions",
            "Show initiative and problem-solving",
            "Connect to company values",
          ],
          difficulty: "Medium",
          tags: ["customer-service", "initiative", "problem-solving"],
          type: "behavioral",
        },
        {
          id: "8",
          question: "Tell me about a time when you had to manage multiple priorities.",
          category: "Time Management",
          tips: [
            "Explain your prioritization strategy",
            "Show how you stayed organized",
            "Demonstrate results achieved",
          ],
          difficulty: "Easy",
          tags: ["time-management", "organization", "prioritization"],
          type: "behavioral",
        },
        {
          id: "9",
          question: "Describe a situation where you received constructive criticism.",
          category: "Feedback",
          tips: [
            "Show openness to feedback",
            "Explain how you implemented changes",
            "Demonstrate growth from the experience",
          ],
          difficulty: "Medium",
          tags: ["feedback", "growth", "communication"],
          type: "behavioral",
        },
        {
          id: "10",
          question: "Tell me about a time when you mentored or helped a colleague.",
          category: "Leadership",
          tips: [
            "Show your ability to develop others",
            "Explain your approach to mentoring",
            "Quantify the impact when possible",
          ],
          difficulty: "Medium",
          tags: ["leadership", "mentoring", "team-development"],
          type: "behavioral",
        },
      ],
      technical: [
        {
          id: "11",
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
        },
        {
          id: "12",
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
        },
        {
          id: "13",
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
        },
        {
          id: "14",
          question: "How do you handle errors in your code?",
          category: "Error Handling",
          tips: [
            "Explain try-catch blocks and error types",
            "Discuss logging and monitoring",
            "Show graceful degradation strategies",
          ],
          difficulty: "Medium",
          tags: ["error-handling", "debugging", "reliability"],
          type: "technical",
        },
        {
          id: "15",
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
        },
        {
          id: "16",
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
        },
        {
          id: "17",
          question: "What are design patterns and why are they important?",
          category: "Software Design",
          tips: [
            "Explain common patterns (Singleton, Factory, Observer)",
            "Discuss benefits and use cases",
            "Show real-world application",
          ],
          difficulty: "Hard",
          tags: ["design-patterns", "architecture", "best-practices"],
          type: "technical",
        },
        {
          id: "18",
          question: "How do you ensure code quality and maintainability?",
          category: "Code Quality",
          tips: [
            "Discuss testing strategies",
            "Explain code reviews and standards",
            "Mention documentation and refactoring",
          ],
          difficulty: "Medium",
          tags: ["testing", "code-quality", "maintenance"],
          type: "technical",
        },
        {
          id: "19",
          question: "Explain the concept of asynchronous programming.",
          category: "Async Programming",
          tips: [
            "Cover callbacks, promises, and async/await",
            "Explain event loops and concurrency",
            "Discuss real-world applications",
          ],
          difficulty: "Medium",
          tags: ["async", "concurrency", "javascript", "programming"],
          type: "technical",
        },
        {
          id: "20",
          question: "How do you approach code reviews?",
          category: "Code Review",
          tips: [
            "Explain what you look for in reviews",
            "Discuss constructive feedback approaches",
            "Show how you handle disagreements",
          ],
          difficulty: "Easy",
          tags: ["code-review", "collaboration", "best-practices"],
          type: "technical",
        },
      ],
      situational: [
        {
          id: "21",
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
        },
        {
          id: "22",
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
        },
        {
          id: "23",
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
        },
        {
          id: "24",
          question: "If you discovered a critical bug in production right before a major deadline, what would you do?",
          category: "Crisis Management",
          tips: [
            "Assess the severity and impact",
            "Communicate with stakeholders immediately",
            "Balance fixing the bug with meeting the deadline",
          ],
          difficulty: "Hard",
          tags: ["crisis-management", "prioritization", "communication"],
          type: "situational",
        },
        {
          id: "25",
          question: "How would you approach onboarding a new team member?",
          category: "Team Building",
          tips: [
            "Create a structured onboarding plan",
            "Pair with experienced team members",
            "Set clear expectations and goals",
          ],
          difficulty: "Easy",
          tags: ["team-building", "mentoring", "leadership"],
          type: "situational",
        },
        {
          id: "26",
          question: "If you were asked to take on additional responsibilities without additional compensation, how would you respond?",
          category: "Career Development",
          tips: [
            "Assess the value to your career growth",
            "Discuss compensation expectations",
            "Consider the bigger picture for your role",
          ],
          difficulty: "Medium",
          tags: ["career-development", "negotiation", "compensation"],
          type: "situational",
        },
        {
          id: "27",
          question: "How would you handle a situation where a client is unhappy with your work?",
          category: "Client Management",
          tips: [
            "Listen actively to their concerns",
            "Take ownership of the issue",
            "Propose solutions and follow through",
          ],
          difficulty: "Medium",
          tags: ["client-management", "communication", "problem-solving"],
          type: "situational",
        },
        {
          id: "28",
          question: "If you were working on a team project and noticed one team member wasn't contributing, what would you do?",
          category: "Team Dynamics",
          tips: [
            "Address the issue privately first",
            "Understand if there are underlying issues",
            "Escalate to manager if necessary",
          ],
          difficulty: "Medium",
          tags: ["team-dynamics", "communication", "leadership"],
          type: "situational",
        },
        {
          id: "29",
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
        },
        {
          id: "30",
          question: "If you were asked to learn a new technology quickly for a project, how would you approach it?",
          category: "Learning",
          tips: [
            "Create a learning plan with milestones",
            "Use multiple resources (docs, tutorials, courses)",
            "Apply learning through small projects",
          ],
          difficulty: "Easy",
          tags: ["learning", "adaptability", "self-improvement"],
          type: "situational",
        },
      ],
      leadership: [
        {
          id: "31",
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
        },
        {
          id: "32",
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
        },
        {
          id: "33",
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
        },
        {
          id: "34",
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
        },
        {
          id: "35",
          question: "Tell me about a time when you had to make a tough decision that affected your team.",
          category: "Difficult Decisions",
          tips: [
            "Explain your decision-making process",
            "Show empathy for team impact",
            "Demonstrate accountability for outcomes",
          ],
          difficulty: "Hard",
          tags: ["decision-making", "leadership", "accountability"],
          type: "leadership",
        },
      ],
      systemDesign: [
        {
          id: "36",
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
        },
        {
          id: "37",
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
        },
        {
          id: "38",
          question: "How would you design a file storage system like Dropbox?",
          category: "System Design",
          tips: [
            "Consider file synchronization",
            "Think about conflict resolution",
            "Address security and privacy concerns",
          ],
          difficulty: "Hard",
          tags: ["system-design", "file-systems", "sync", "security"],
          type: "systemDesign",
        },
      ],
      productSense: [
        {
          id: "39",
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
        },
        {
          id: "40",
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

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${questionCount} interview questions to Firebase`,
      data: {
        totalQuestions: questionCount,
        categories: Object.keys(interviewQuestions),
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
