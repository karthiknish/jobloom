"use client";

import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";

export default function AccountPage() {
  const { user } = useUser();

  if (!user) {
    return <div>Please sign in to access your account.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Profile Information
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{user.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Member Since
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(user.createdAt!), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Usage Statistics
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">0</div>
                  <div className="text-sm text-gray-500">Jobs Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-500">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-500">Interviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
