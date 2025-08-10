// components/admin/UserManagement.tsx
import { useApiMutation } from "../../hooks/useApi";
import { adminApi } from "../../utils/api/admin";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage admin privileges for users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  {user._id !== currentUser._id && (
                    user.isAdmin ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveAdmin(user._id)}
                        disabled={removeAdminLoading}
                      >
                        Remove Admin
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSetAdmin(user._id)}
                        disabled={setAdminLoading}
                      >
                        Make Admin
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}