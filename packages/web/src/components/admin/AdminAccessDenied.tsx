// components/admin/AdminAccessDenied.tsx
import Link from "next/link";

export function AdminAccessDenied() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access the admin panel.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}