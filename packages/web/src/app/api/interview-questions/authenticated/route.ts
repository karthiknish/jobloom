import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";

// Protected endpoint for interview questions - authentication required
export async function GET(request: NextRequest) {
  try {
    // Verify session
    const decodedToken = await verifySessionFromRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock interview questions data for authenticated access
    const interviewQuestions = {
      behavioral: [
        {
          id: "1",
          question: "Tell me about a time when you faced a challenging situation at work. How did you handle it?",
          category: "Problem Solving",
          tips: [
            "Use the STAR method (Situation, Task, Action, Result)",
            "Focus on your individual contribution",
            "Show how you learned from the experience"
          ],
          difficulty: "Medium",
          tags: [
            "problem-solving",
            "leadership",
            "resilience"
          ],
          type: "behavioral",
        },
        {
          id: "2",
          question: "Describe a time when you had to work with a difficult team member. How did you manage the situation?",
          category: "Teamwork",
          tips: [
            "Stay professional and focus on facts",
            "Highlight communication and conflict resolution skills",
            "Show empathy and understanding"
          ],
          difficulty: "Medium",
          tags: [
            "teamwork",
            "communication",
            "conflict-resolution"
          ],
          type: "behavioral",
        }
      ],
      technical: [
        {
          id: "11",
          question: "Explain the difference between let, const, and var in JavaScript.",
          category: "JavaScript",
          tips: [
            "Explain scope differences",
            "Mention hoisting behavior",
            "Give practical examples"
          ],
          difficulty: "Easy",
          tags: [
            "javascript",
            "variables",
            "scope"
          ],
          type: "technical",
        }
      ],
      situational: [
        {
          id: "21",
          question: "How would you handle a situation where a project deadline is approaching and you're falling behind?",
          category: "Project Management",
          tips: [
            "Communicate early with stakeholders",
            "Prioritize tasks and delegate when possible",
            "Focus on the most important deliverables"
          ],
          difficulty: "Medium",
          tags: [
            "project-management",
            "communication",
            "prioritization"
          ],
          type: "situational",
        }
      ],
      leadership: [
        {
          id: "31",
          question: "Tell me about a time when you led a team through a challenging project.",
          category: "Team Leadership",
          tips: [
            "Describe your leadership style",
            "Show how you motivated and guided the team",
            "Quantify the success achieved"
          ],
          difficulty: "Hard",
          tags: [
            "leadership",
            "team-management",
            "project-delivery"
          ],
          type: "leadership",
        }
      ],
      systemDesign: [
        {
          id: "36",
          question: "How would you design a URL shortening service like bit.ly?",
          category: "System Design",
          tips: [
            "Consider scalability and performance",
            "Think about data storage and retrieval",
            "Address edge cases and error handling"
          ],
          difficulty: "Hard",
          tags: [
            "system-design",
            "scalability",
            "architecture"
          ],
          type: "systemDesign",
        }
      ],
      productSense: [
        {
          id: "39",
          question: "How would you improve the user experience of a product you're familiar with?",
          category: "Product Thinking",
          tips: [
            "Identify pain points and user needs",
            "Propose specific, actionable improvements",
            "Consider technical feasibility and business impact"
          ],
          difficulty: "Medium",
          tags: [
            "product-thinking",
            "ux",
            "improvement"
          ],
          type: "productSense",
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: interviewQuestions,
      message: "Sample interview questions for reference"
    });
  } catch (error) {
    console.error("Error fetching interview questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview questions" },
      { status: 500 }
    );
  }
}
