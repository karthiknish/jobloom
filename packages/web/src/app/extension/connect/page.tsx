"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/components/ui/Toast";

export default function ConnectExtensionPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If FirebaseAuthProvider has set __firebase_user, post a message the content script can see
  useEffect(() => {
    const w = window as any;
    const id = w.__firebase_user?.id || JSON.parse(localStorage.getItem("__firebase_user") || "{}")?.id;

    if (id) {
      setUid(String(id));
      setConnectionStatus('connected');
      window.postMessage({ type: "FIREBASE_AUTH_SUCCESS", uid: String(id) }, window.location.origin);
    } else {
      setConnectionStatus('error');
      setErrorMessage('No authentication found. Please sign in first.');
    }
  }, []);

  const syncExtensionSettings = async () => {
    try {
      // Ask extension to send settings; the content script should relay to background/popup
      window.postMessage({ type: "JOBLOOM_REQUEST_SETTINGS_SYNC" }, window.location.origin);
      showSuccess("Requested settings sync. Check your extension.");
    } catch (error) {
      console.error('Failed to sync extension settings:', error);
      setErrorMessage('Failed to sync extension settings. Please try again.');
    }
  };

  const retryConnection = () => {
    setConnectionStatus('connecting');
    setErrorMessage(null);
    window.location.reload();
  };

  return (
    <div className="max-w-lg mx-auto py-16 px-6">
      <h1 className="text-xl font-semibold mb-2">Connect your Extension</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Keep this tab open while you sign in. The extension will automatically connect to your account.
      </p>

      <div className="rounded-md border p-4 mb-6">
        <div className="text-sm mb-2">Connection Status:</div>
        <div className="text-sm">
          {connectionStatus === 'connecting' && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              <span className="text-muted-foreground">Connecting...</span>
            </div>
          )}
          {connectionStatus === 'connected' && uid && (
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✅</span>
              <span className="text-green-600">Connected (UID: {uid})</span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <span className="text-red-600">Connection failed</span>
            </div>
          )}
        </div>
        {errorMessage && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {connectionStatus === 'error' && (
          <Button onClick={retryConnection} variant="outline">
            Retry Connection
          </Button>
        )}
        {connectionStatus === 'connected' && (
          <Button onClick={syncExtensionSettings} variant="secondary">
            Sync Settings from Extension
          </Button>
        )}
        <a href="/dashboard" className="inline-flex">
          <Button>Go to Dashboard</Button>
        </a>
      </div>
    </div>
  );
}
