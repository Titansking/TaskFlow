/**
 * Profile page: view and edit the signed-in user's own details.
 *
 * Redirects to /login when there is no cached session, then re-reads the
 * profile from the server so the page always reflects the database rather than
 * a stale localStorage copy.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { logout, useHasHydrated, useSession } from '@/lib/session';
import { authService } from '@/lib/api';
import type { TeamMember } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useSession();
  const hasHydrated = useHasHydrated();
  // A primitive id, not the object: a new object identity on every store write
  // would re-run the fetch below, and the fetch writes back to the store.
  const userId = currentUser?.id ?? null;

  const [user, setUser] = useState<TeamMember | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // `useSession` reads `null` for one render during hydration, so wait for
    // hydration before deciding whether this visitor is signed in.
    if (!hasHydrated) return;

    if (!userId) {
      logout();
      return;
    }

    let cancelled = false;

    authService
      .fetchProfile()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setName(profile.name);
      })
      .catch(() => {
        // The token may have expired; the API interceptor already logged us out.
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const updated = await authService.updateProfile({ name });
      setUser(updated);
      setName(updated.name);
      setFeedback({ kind: 'ok', text: 'Profile updated successfully' });
    } catch (cause) {
      setFeedback({
        kind: 'error',
        text: cause instanceof ApiError ? cause.message : 'Failed to update profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-10 max-w-2xl">Loading…</div>;
  }

  if (!user) return null;

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">{user.avatar}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {feedback && (
              <div
                role="status"
                className={
                  feedback.kind === 'ok'
                    ? 'rounded-md bg-green-100 dark:bg-green-900/30 p-3 text-sm text-green-700 dark:text-green-300'
                    : 'rounded-md bg-destructive/15 p-3 text-sm text-destructive'
                }
              >
                {feedback.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                Your avatar initials are regenerated from this name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={user.email} disabled className="bg-muted" />
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-between border-t p-6">
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
          <Button variant="destructive" onClick={logout}>
            Log out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}