"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/components/ui/Toast";

export default function ConnectExtensionPage() {
  const [uid, setUid] = useState<string | null>(null);

  // If FirebaseAuthProvider has set __firebase_user, post a message the content script can see
  useEffect(() => {
    const w = window as any;
    const id = w.__firebase_user?.id || JSON.parse(localStorage.getItem("__firebase_user") || "{}")?.id;
    if (id) {
      setUid(String(id));
      window.postMessage({ type: "FIREBASE_AUTH_SUCCESS", uid: String(id) }, window.location.origin);
    }
  }, []);

  const syncExtensionSettings = async () => {
    try {
      // Ask extension to send settings; the content script should relay to background/popup
      window.postMessage({ type: "JOBLOOM_REQUEST_SETTINGS_SYNC" }, window.location.origin);
      showSuccess("Requested settings sync. Check your extension.");
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-lg mx-auto py-16 px-6">
      <h1 className="text-xl font-semibold mb-2">Connect your Extension</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Keep this tab open while you sign in. The extension will automatically connect to your account.
      </p>
      <div className="rounded-md border p-4">
        <div className="text-sm mb-2">Status:</div>
        <div className="text-sm">
          {uid ? (
            <span className="text-green-600">Connected (UID: {uid})</span>
          ) : (
            <span className="text-muted-foreground">Waiting for authentication…</span>
          )}
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <Button onClick={syncExtensionSettings} variant="secondary">Sync Settings from Extension</Button>
        <a href="/dashboard" className="inline-flex">
          <Button>Go to Dashboard</Button>
        </a>
      </div>
    </div>
  );
}
