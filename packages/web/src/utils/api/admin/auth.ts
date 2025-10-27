import { getAuthClient } from "@/firebase/client";

// Authentication utility for admin modules
export const verifyAdminAccess = async () => {
  const auth = getAuthClient();
  if (!auth?.currentUser) {
    throw new Error("Authentication required");
  }

  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/admin/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Admin access denied");
  }

  const data = await response.json();
  return data.user;
};
