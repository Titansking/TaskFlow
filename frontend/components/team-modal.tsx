/**
 * Team management dialog: the member directory plus an invite form.
 *
 * Permissions arrive as props (`canManageTeam`, `isAdmin`) rather than being
 * re-read from localStorage during render. The server enforces the same rules,
 * so hiding a button is only a courtesy — never the guard.
 */
'use client';

import { useState } from 'react';
import { Mail, MoreHorizontal, UserPlus, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiError } from '@/lib/api';
import { USER_ROLES, type MemberDraft, type TeamMember, type UserRole } from '@/lib/types';

export interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
  /** Admins and Project Managers may invite new people. */
  canManageTeam: boolean;
  /** Only Admins may change roles or remove members. */
  isAdmin: boolean;
  onMemberAdded: (draft: MemberDraft) => Promise<void>;
  onMemberRoleChange: (id: string, role: UserRole) => Promise<void>;
  onMemberRemoved: (id: string) => Promise<void>;
  onOpenMessages: () => void;
}

const STATUS_DOT: Record<TeamMember['status'], string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

const ROLE_BADGE: Record<UserRole, string> = {
  Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Project Manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Team Member': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

/* ------------------------------- invite form ------------------------------ */

interface InviteFormProps {
  onSubmit: (draft: MemberDraft) => Promise<void>;
  onCancel: () => void;
}

function InviteForm({ onSubmit, onCancel }: InviteFormProps) {
  const [form, setForm] = useState<MemberDraft>({
    name: '',
    email: '',
    password: '',
    role: 'Team Member',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof MemberDraft>(key: K, value: MemberDraft[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(form);
      onCancel();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not invite that person');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="invite-name">Full Name</Label>
        <Input
          id="invite-name"
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          required
          maxLength={80}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-password">Temporary Password</Label>
        <Input
          id="invite-password"
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          placeholder="At least 8 characters, with a letter and a number"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Share this with the new member so they can sign in for the first time.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={form.role}
          onValueChange={(value) => update('role', value as UserRole)}
        >
          <SelectTrigger id="invite-role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Inviting...' : 'Send Invitation'}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------- the modal ------------------------------- */

export function TeamModal({
  isOpen,
  onClose,
  teamMembers,
  currentUser,
  canManageTeam,
  isAdmin,
  onMemberAdded,
  onMemberRoleChange,
  onMemberRemoved,
  onOpenMessages,
}: TeamModalProps) {
  const [view, setView] = useState<'list' | 'invite'>('list');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setView('list');
    setError(null);
    onClose();
  };

  const handleRemove = async (member: TeamMember) => {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;

    try {
      await onMemberRemoved(member.id);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not remove that member');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
          <DialogDescription>Manage your team and invite new members</DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {view === 'list' ? (
          <>
            {canManageTeam && (
              <div className="flex justify-end mb-4">
                <Button onClick={() => setView('invite')} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            )}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-lg">{member.avatar}</AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${STATUS_DOT[member.status]}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.name}
                        {member.id === currentUser?.id && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className={ROLE_BADGE[member.role]} variant="outline">
                      {member.role}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${member.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/users/${member.id}`}>View Profile</a>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            close();
                            onOpenMessages();
                          }}
                        >
                          Send Message
                        </DropdownMenuItem>

                        {isAdmin && member.id !== currentUser?.id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  {USER_ROLES.map((role) => (
                                    <DropdownMenuItem
                                      key={role}
                                      disabled={role === member.role}
                                      onClick={() => void onMemberRoleChange(member.id, role)}
                                    >
                                      {role}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => void handleRemove(member)}
                            >
                              Remove from Team
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /*
            Switching back to the list unmounts this form, so reopening the
            dialog always starts from an empty form — no reset effect needed.
          */
          <InviteForm onSubmit={onMemberAdded} onCancel={() => setView('list')} />
        )}
      </DialogContent>
    </Dialog>
  );
}