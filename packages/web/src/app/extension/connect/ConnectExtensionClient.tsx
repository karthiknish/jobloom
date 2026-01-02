
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/components/ui/Toast";
import { CheckCircle, XCircle } from "lucide-react";
import { useOnboardingState } from "@/hooks/useOnboardingState";

export default function ConnectExtensionClient() {
  const [uid, setUid] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>(
    'connecting'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const onboarding = useOnboardingState();

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const readUserId = () => {
      const w = window as any;
      const storedUser = localStorage.getItem("__firebase_user");
      const parsed = storedUser ? JSON.parse(storedUser) : {};
      const id = w.__firebase_user?.id || parsed?.id;
      return id ? String(id) : null;
    };

    const connectWithUid = (stringId: string) => {
      if (!isMounted) return;
      setUid(stringId);
      setConnectionStatus('connected');
      setErrorMessage(null);
      window.postMessage({ type: "FIREBASE_AUTH_SUCCESS", uid: stringId }, window.location.origin);

      if (!onboarding.hasConnectedExtension) {
        onboarding.markExtensionConnected();
      }
    };

    const tryConnect = () => {
      const id = readUserId();
      if (id) {
        connectWithUid(id);
        return true;
      }
      return false;
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "FIREBASE_AUTH_SUCCESS" && event.data?.uid) {
        connectWithUid(String(event.data.uid));
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial attempt
    if (!tryConnect()) {
      setConnectionStatus('connecting');

      // Poll briefly while Firebase hydrates auth state.
      intervalId = window.setInterval(() => {
        if (tryConnect()) {
          if (intervalId) window.clearInterval(intervalId);
          if (timeoutId) window.clearTimeout(timeoutId);
        }
      }, 250);

      // Only show an error after a grace period.
      timeoutId = window.setTimeout(() => {
        if (!isMounted) return;
        if (!tryConnect()) {
          setConnectionStatus('error');
          setErrorMessage('No authentication found. Please sign in first.');
        }
      }, 4000);
    }

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleMessage);
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [onboarding]);

  useEffect(() => {
    if (errorMessage) {
      showError("Connection error", errorMessage);
    }
  }, [errorMessage]);

  const syncExtensionSettings = async () => {
    try {
      window.postMessage({ type: "HIREALL_REQUEST_SETTINGS_SYNC" }, window.location.origin);
      showSuccess("Requested settings sync. Check your extension.");
    } catch (error) {
      console.error('Failed to sync extension settings:', error);
      setConnectionStatus('error');
      setErrorMessage('Failed to sync extension settings. Please try again.');
    }
  };

  const retryConnection = () => {
    setConnectionStatus('connecting');
    setErrorMessage(null);
    window.location.reload();
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-6">
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
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-green-600">Connected (UID: {uid})</span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center text-muted-foreground">
              <XCircle className="h-4 w-4 mr-2" />
              <span>Connection failed. See notification for details.</span>
            </div>
          )}
        </div>
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
