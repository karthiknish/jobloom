"use client";
import { useState, useCallback } from 'react';
import { showError, showSuccess } from '@/components/ui/Toast';
import { useFirebaseAuth } from '@/providers/firebase-auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Props {
  initialSubdomain?: string | null;
}

export function SubdomainSettings({ initialSubdomain }: Props) {
  const { user } = useFirebaseAuth();
  const [subdomain, setSubdomain] = useState(initialSubdomain || '');
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);

  const validateLocal = (val: string) => {
    if (!val) return 'Enter a subdomain';
    if (val.length < 3) return 'Too short';
    if (!/^[a-z0-9-]+$/.test(val)) return 'Use lowercase letters, numbers, hyphen';
    if (val.startsWith('-') || val.endsWith('-')) return 'Cannot start/end with hyphen';
    if (val.includes('--')) return 'No consecutive hyphens';
    return null;
  };

  const checkAvailability = useCallback(async () => {
    const err = validateLocal(input);
    if (err) { showError(err); return; }
    setChecking(true);
    setAvailable(null);
    try {
      const res = await fetch(`/api/subdomain?name=${encodeURIComponent(input)}`);
      const json = await res.json();
      if (json.available) {
        setAvailable(true);
        showSuccess('Available');
      } else {
        setAvailable(false);
        showError(json.reason || 'Not available');
      }
    } catch {
      showError('Failed to check');
    } finally {
      setChecking(false);
    }
  }, [input]);

  const claim = useCallback(async () => {
    if (!user) return;
    if (subdomain) { showError('Subdomain already claimed'); return; }
    if (!available || input !== input.trim().toLowerCase()) { showError('Check availability first'); return; }
    setClaiming(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subdomain: input.trim().toLowerCase() })
      });
      const json = await res.json();
      if (!res.ok) {
        showError(json.error || 'Failed to claim');
      } else {
        setSubdomain(json.subdomain);
        showSuccess('Subdomain claimed');
      }
    } catch {
      showError('Request failed');
    } finally {
      setClaiming(false);
    }
  }, [user, available, input, subdomain]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Portfolio Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subdomain ? (
          <div className="space-y-2">
            <p className="text-sm">Your public portfolio is live at:</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-gray-100 px-2 py-1 text-sm">https://{subdomain}.hireall.app</code>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(`https://${subdomain}.hireall.app`)}>Copy</Button>
            </div>
            <p className="text-xs text-gray-500">Changes are locked once claimed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Claim a unique link for sharing your portfolio publicly.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-1 flex-1">
                <Input
                  placeholder="yourname"
                  value={input}
                  onChange={e => { setInput(e.target.value.toLowerCase()); setAvailable(null); }}
                  disabled={claiming}
                />
                <span className="text-sm text-gray-500">.hireall.app</span>
              </div>
              <Button type="button" onClick={checkAvailability} disabled={checking || !input}> {checking ? 'Checking...' : 'Check'} </Button>
              <Button type="button" onClick={claim} disabled={claiming || !available}> {claiming ? 'Claiming...' : 'Claim'} </Button>
            </div>
            {available === true && <p className="text-xs text-green-600">Available</p>}
            {available === false && <p className="text-xs text-red-600">Not available</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
