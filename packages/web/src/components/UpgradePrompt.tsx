// components/UpgradePrompt.tsx
import { useState } from "react";
import { motion } from "framer-motion";

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
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 shadow-sm"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Unlock Your Full Potential
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upgrade to Jobloom Pro and get access to advanced features that will 
            supercharge your job search
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isHovered ? "🚀 Upgrade Now" : "🌟 Upgrade to Pro"}
          </motion.button>
          <p className="text-sm text-gray-500 mt-4">
            7-day free trial • Cancel anytime
          </p>
        </div>
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
