// components/admin/AdminAccessDenied.tsx
import Link from "next/link";

export function AdminAccessDenied() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <div className="bg-background shadow-xl rounded-lg p-8 max-w-md w-full text-center border">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h2 className="text-3xl font-bold text-foreground mb-3">Access Denied</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          You don&apos;t have permission to access the admin panel. 
          Your account does not have administrator privileges.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors w-full"
          >
            Return to Home
          </Link>
          
          <Link
            href="/dashboard"
            className="inline-block bg-secondary text-secondary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors w-full"
          >
            Go to Dashboard
          </Link>
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-md">
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Need admin access?</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Contact an existing administrator to have your account granted admin privileges.
          </p>
        </div>
      </div>
    </div>
  );
}