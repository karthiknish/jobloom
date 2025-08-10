// components/UpgradePrompt.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    title: "Advanced Analytics",
    description: "Get detailed insights into your job search progress and success rates",
    icon: "📊",
  },
  {
    title: "AI-Powered Recommendations",
    description: "Receive personalized job recommendations based on your profile",
    icon: "🤖",
  },
  {
    title: "Priority Support",
    description: "Get faster responses from our dedicated support team",
    icon: "⚡",
  },
  {
    title: "Custom Alerts",
    description: "Set up custom job alerts for specific companies or roles",
    icon: "🔔",
  },
];

export function UpgradePrompt() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Unlock Your Full Potential
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upgrade to Jobloom Pro and get access to advanced features that will 
                supercharge your job search
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                >
                  <Card className="bg-white border-gray-100">
                    <CardContent className="p-6">
                      <div className="text-3xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                  size="lg"
                >
                  {isHovered ? "🚀 Upgrade Now" : "🌟 Upgrade to Pro"}
                </Button>
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4">
                7-day free trial • Cancel anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

interface FeatureGateProps {
  children: React.ReactNode;
}

export function FeatureGate({
  children,
}: FeatureGateProps) {
  // All features are now available to all users
  return <>{children}</>;
}
