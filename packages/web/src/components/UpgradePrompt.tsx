interface UpgradePromptProps {
  feature: string;
  description: string;
  className?: string;
}

export function UpgradePrompt({
  feature,
  description,
  className = "",
}: UpgradePromptProps) {
  return (
    <div
      className={`bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚀 {feature}
          </h3>
          <p className="text-gray-600 mb-4">{description}</p>
        </div>
      </div>
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
