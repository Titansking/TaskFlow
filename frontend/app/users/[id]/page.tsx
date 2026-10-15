/**
 * Public-ish profile page for a single team member.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { userService } from '@/lib/api';
import type { TeamMember, UserRole, UserStatus } from '@/lib/types';

const ROLE_BADGE: Record<UserRole, string> = {
  Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Project Manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Team Member': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const STATUS_DOT: Record<UserStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;

    userService
      .get(params.id)
      .then((member) => {
        if (!cancelled) setUser(member);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading…</div>;
  }

  if (hasError || !user) {
    return (
      <div className="container mx-auto py-10 max-w-2xl text-center">
        <h2 className="text-xl font-bold text-destructive mb-4">
          {hasError ? 'Failed to load this member' : 'User not found'}
        </h2>
        <Button onClick={() => router.push('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Member Details</CardTitle>
          <CardDescription>View information about this team member</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">{user.avatar}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background ${STATUS_DOT[user.status]}`}
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <Badge className={ROLE_BADGE[user.role]} variant="outline">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">Email</div>
              <div className="col-span-2">{user.email}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">Status</div>
              <div className="col-span-2 capitalize">{user.status}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">User ID</div>
              <div className="col-span-2 font-mono text-sm text-muted-foreground">{user.id}</div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between border-t p-6">
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
          <Button asChild>
            <a href={`mailto:${user.email}`}>Send Message</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}