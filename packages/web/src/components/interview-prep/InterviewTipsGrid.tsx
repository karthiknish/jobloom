"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Target,
  Briefcase,
  Mail,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InterviewTip {
  title: string;
  description: string;
  icon: string;
}

const interviewTips: InterviewTip[] = [
  {
    title: "Research the Company",
    description:
      "Spend time learning about the company's culture, values, recent news, and products.",
    icon: "briefcase",
  },
  {
    title: "Prepare Your Stories",
    description:
      "Have 3-5 stories ready that demonstrate your skills and experiences using the STAR method.",
    icon: "book-open",
  },
  {
    title: "Practice Common Questions",
    description:
      "Prepare answers for behavioral, situational, and technical questions relevant to your role.",
    icon: "target",
  },
  {
    title: "Prepare Questions for Interviewer",
    description:
      "Have thoughtful questions ready that show your interest in the role and company.",
    icon: "help-circle",
  },
  {
    title: "Follow Up",
    description:
      "Send a thank-you email within 24 hours, reiterating your interest and key points.",
    icon: "mail",
  },
];

const getInterviewTipIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    briefcase: Briefcase,
    target: Target,
    "book-open": BookOpen,
    clock: MessageSquare,
    mail: Mail,
    "help-circle": HelpCircle,
  };
  return icons[iconName] || MessageSquare;
};

export default function InterviewTipsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {interviewTips.map((tip, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -4, scale: 1.02 }}
        >
          <Card className="h-full hover-depth interactive-depth depth-transition cursor-pointer card-depth-2 border-border">
            <CardHeader className="text-center">
              <motion.div
                className="mb-3 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 10,
                }}
              >
                {(() => {
                  const Icon = getInterviewTipIcon(tip.icon);
                  return <Icon className="h-12 w-12" />;
                })()}
              </motion.div>
              <CardTitle className="text-lg">{tip.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-sm leading-relaxed">
                {tip.description}
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
