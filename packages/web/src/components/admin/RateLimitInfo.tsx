// components/admin/RateLimitInfo.tsx
import { useRateLimit } from "../../hooks/useRateLimit";

interface RateLimitInfoProps {
  rateLimit: ReturnType<typeof useRateLimit>;
}

export function RateLimitInfo({ rateLimit }: RateLimitInfoProps) {
  return (
    <div className="text-sm text-muted-foreground">
      <span className="mr-4">
        Requests remaining: <span className="font-medium">{rateLimit.remaining}</span>/5
      </span>
      {rateLimit.isLimited && (
        <span className="text-red-600">
          Reset in: {Math.ceil(rateLimit.getTimeUntilReset() / 1000)}s
        </span>
      )}
    </div>
  );
}