"use client";
import { useState, useCallback, useMemo, useEffect } from 'react';
import { showError, showSuccess } from '@/components/ui/Toast';
import { useFirebaseAuth } from '@/providers/firebase-auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const RESERVED = ["www", "app", "admin", "beta", "api", "support"];

const SUBDOMAIN_SUGGESTIONS: Array<(context: { email?: string | null; displayName?: string | null }) => string> = [
  ({ displayName }) => displayName ? displayName.replace(/[^a-z0-9]+/gi, '').slice(0, 18).toLowerCase() : '',
  ({ email }) => email ? email.split('@')[0].replace(/[^a-z0-9-]+/gi, '').slice(0, 18).toLowerCase() : '',
  () => `hire-${Math.random().toString(36).slice(2, 8)}`,
];

const NORMALIZE = (val: string) => val.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

const FEEDBACK_VARIANTS = {
  neutral: 'text-muted-foreground',
  success: 'text-emerald-600',
  error: 'text-red-600',
} as const;

type FeedbackVariant = keyof typeof FEEDBACK_VARIANTS;

const LENGTH_LIMIT = 32;

const useSuggested = (userEmail?: string | null, displayName?: string | null) => {
  return useMemo(() => {
    const base = SUBDOMAIN_SUGGESTIONS
      .map((fn) => NORMALIZE(fn({ email: userEmail, displayName })))
      .filter((val, idx, arr) => val && idx === arr.indexOf(val))
      .filter((val) => val.length >= 3 && !RESERVED.includes(val));
    return base.slice(0, 4);
  }, [userEmail, displayName]);
};

interface Props {
  initialSubdomain?: string | null;
  onSubdomainAssigned?: (value: string) => void;
}

export function SubdomainSettings({ initialSubdomain, onSubdomainAssigned }: Props) {
  const { user } = useFirebaseAuth();
  const [subdomain, setSubdomain] = useState(initialSubdomain || '');
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; variant: FeedbackVariant }>({ message: '', variant: 'neutral' });

  const suggestions = useSuggested(user?.email, user?.displayName);

  useEffect(() => {
    if (initialSubdomain && initialSubdomain !== subdomain) {
      setSubdomain(initialSubdomain);
      setInput('');
      setAvailable(null);
      setFeedback({ message: '', variant: 'neutral' });
    }
  }, [initialSubdomain]);

  const updateFeedback = (message: string, variant: FeedbackVariant) => {
    setFeedback({ message, variant });
  };

  const validateLocal = (val: string) => {
    if (!val) return 'Enter a subdomain';
    if (val.length < 3) return 'Too short (min 3 characters)';
    if (val.length > LENGTH_LIMIT) return `Too long (max ${LENGTH_LIMIT} characters)`;
    if (!/^[a-z0-9-]+$/.test(val)) return 'Use lowercase letters, numbers, hyphen';
    if (val.startsWith('-') || val.endsWith('-')) return 'Cannot start or end with hyphen';
    if (val.includes('--')) return 'No consecutive hyphens';
    if (RESERVED.includes(val)) return 'That name is reserved';
    return null;
  };

  const checkAvailability = useCallback(async () => {
    const normalized = NORMALIZE(input);
    setInput(normalized);
    const err = validateLocal(normalized);
    if (err) {
      updateFeedback(err, 'error');
      showError(err);
      return;
    }
    setChecking(true);
    setAvailable(null);
    updateFeedback('Checking availability…', 'neutral');
    try {
      const res = await fetch(`/api/subdomain?name=${encodeURIComponent(normalized)}`);
      const json = await res.json();
      if (json.available) {
        setAvailable(true);
        updateFeedback('Great news! That subdomain is available.', 'success');
        showSuccess('Available');
      } else {
        setAvailable(false);
        const reason = json.reason || 'Not available';
        updateFeedback(reason, 'error');
        showError(reason);
      }
    } catch {
      const message = 'Failed to check availability. Try again.';
      updateFeedback(message, 'error');
      showError(message);
    } finally {
      setChecking(false);
    }
  }, [input, validateLocal]);

  const claim = useCallback(async () => {
    if (!user) {
      showError('Please sign in to claim a subdomain');
      return;
    }
    if (subdomain) {
      showError('Subdomain already claimed');
      return;
    }
    const normalized = NORMALIZE(input);
    const err = validateLocal(normalized);
    if (err) {
      updateFeedback(err, 'error');
      showError(err);
      return;
    }
    if (!available) {
      const message = 'Please check availability before claiming';
      updateFeedback(message, 'error');
      showError(message);
      return;
    }
    setClaiming(true);
    updateFeedback('Claiming your subdomain…', 'neutral');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subdomain: normalized })
      });
      const json = await res.json();
      if (!res.ok) {
        const message = json.error || 'Failed to claim subdomain';
        updateFeedback(message, 'error');
        showError(message);
      } else {
        setSubdomain(json.subdomain);
        onSubdomainAssigned?.(json.subdomain);
        updateFeedback('Subdomain claimed! Your portfolio link is live.', 'success');
        showSuccess('Subdomain claimed');
      }
    } catch {
      const message = 'Request failed. Please try again.';
      updateFeedback(message, 'error');
      showError(message);
    } finally {
      setClaiming(false);
    }
  }, [user, available, input, subdomain, validateLocal]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Portfolio Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subdomain ? (
          <div className="space-y-2">
            <p className="text-sm">Your public portfolio is live at:</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded border border-primary/20 bg-card px-2 py-1 text-sm text-primary">
                https://{subdomain}.hireall.app
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(`https://${subdomain}.hireall.app`)}
              >
                Copy
              </Button>
              <Badge variant="outline" className="text-xs capitalize">
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Need a different link? Contact support to request a change.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Claim a unique link for sharing your portfolio publicly.</p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    placeholder="yourname"
                    value={input}
                    onChange={e => {
                      const normalized = NORMALIZE(e.target.value);
                      setInput(normalized);
                      setAvailable(null);
                      updateFeedback('', 'neutral');
                    }}
                    disabled={claiming}
                  />
                  <span className="text-sm text-muted-foreground">.hireall.app</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const suggestion = suggestions[0];
                      if (suggestion) {
                        setInput(suggestion);
                        setAvailable(null);
                        updateFeedback('Suggestion applied. Check availability to reserve it.', 'neutral');
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    <Wand2 className="h-4 w-4" />
                    Suggest
                  </Button>
                  <Button type="button" onClick={checkAvailability} disabled={checking || !input} className="gap-1">
                    {checking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking…
                      </>
                    ) : (
                      'Check'
                    )}
                  </Button>
                  <Button type="button" onClick={claim} disabled={claiming || !available} variant="secondary" className="gap-1">
                    {claiming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Claiming…
                      </>
                    ) : (
                      'Claim'
                    )}
                  </Button>
                </div>
              </div>

              {suggestions.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setInput(suggestion);
                          setAvailable(null);
                          updateFeedback('Suggestion applied. Check availability to reserve it.', 'neutral');
                        }}
                        className={cn(
                          'rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary',
                          suggestion === input && 'border-primary bg-primary/10 text-primary'
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {feedback.message && (
                <p className={cn('text-xs', FEEDBACK_VARIANTS[feedback.variant])}>{feedback.message}</p>
              )}

              <p className="text-[11px] text-muted-foreground">
                Tips: use your name or brand, keep it short, and avoid special characters. Once claimed, the subdomain is locked to your account.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
