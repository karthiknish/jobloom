// components/admin/UserManagement.tsx
import { useState } from "react";
import { useApiMutation } from "../../hooks/useApi";
import { adminApi } from "../../utils/api/admin";
import toast from "react-hot-toast";

interface User {
  _id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  createdAt: number;
}

interface UserManagementProps {
  users: User[];
  currentUser: { _id: string };
  onUsersUpdate: () => void;
}

export function UserManagement({ users, currentUser, onUsersUpdate }: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const { mutate: setAdminUser, loading: setAdminLoading } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { userId } = variables;
      return adminApi.setAdminUser(userId as string, currentUser._id);
    }
  );
  
  const { mutate: removeAdminUser, loading: removeAdminLoading } = useApiMutation(
    (variables: Record<string, unknown>) => {
      const { userId } = variables;
      return adminApi.removeAdminUser(userId as string, currentUser._id);
    }
  );

  const handleSetAdmin = async (userId: string) => {
    try {
      await setAdminUser({ userId });
      toast.success("User granted admin privileges");
      onUsersUpdate();
    } catch (error) {
      toast.error("Failed to grant admin privileges");
      console.error("Error setting admin:", error);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      await removeAdminUser({ userId });
      toast.success("Admin privileges removed");
      onUsersUpdate();
    } catch (error) {
      toast.error("Failed to remove admin privileges");
      console.error("Error removing admin:", error);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          User Management
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage admin privileges for users.
        </p>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {users.map((user) => (
          <li key={user._id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    {user.isAdmin ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        User
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex text-sm text-gray-500">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                {user._id !== currentUser._id && (
                  user.isAdmin ? (
                    <button
                      onClick={() => handleRemoveAdmin(user._id)}
                      disabled={removeAdminLoading}
                      className="ml-2 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                    >
                      Remove Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSetAdmin(user._id)}
                      disabled={setAdminLoading}
                      className="ml-2 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50"
                    >
                      Make Admin
                    </button>
                  )
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}