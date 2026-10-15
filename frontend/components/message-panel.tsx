/**
 * Per-project message panel.
 *
 * Messaging is still local-only (mock data), which is called out in the UI so it
 * is not mistaken for a real feature. The structure is deliberately the same
 * as the real thing would be, so wiring a `Message` model + socket later is a
 * service change, not a component rewrite.
 */
'use client';

import { useMemo, useState } from 'react';
import { Hash, MessageSquare, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Project, TeamMember } from '@/lib/types';

export interface MessagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sentAt: string;
}

/** Seed conversation so the panel is not an empty box on first open. */
const seedMessages = (projectId: string, currentUserId?: string): Message[] => [
  {
    id: `${projectId}-1`,
    content: 'Hey team, how is the progress going?',
    senderId: 'seed-alex',
    sentAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: `${projectId}-2`,
    content: 'Almost done with the first phase.',
    senderId: currentUserId ?? 'seed-alex',
    sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export function MessagePanel({
  isOpen,
  onClose,
  projects,
  teamMembers,
  currentUser,
}: MessagePanelProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Record<string, Message[]>>({});

  // Default to the first project without an effect: derive it, don't store it.
  const selectedProjectId = activeProjectId ?? projects[0]?.id ?? null;

  const activeProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  const memberById = useMemo(
    () => new Map(teamMembers.map((member) => [member.id, member])),
    [teamMembers],
  );

  const messages = useMemo(() => {
    if (!selectedProjectId) return [];
    return [...(sent[selectedProjectId] ?? []), ...seedMessages(selectedProjectId, currentUser?.id)];
  }, [selectedProjectId, sent, currentUser?.id]);

  const memberCount = activeProject
    ? teamMembers.filter((member) => activeProject.members.includes(member.id)).length
    : 0;

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !currentUser) return;

    const content = (drafts[selectedProjectId] ?? '').trim();
    if (!content) return;

    const message: Message = {
      id: `${selectedProjectId}-${Date.now()}`,
      content,
      senderId: currentUser.id,
      sentAt: new Date().toISOString(),
    };

    setSent((prev) => ({
      ...prev,
      [selectedProjectId]: [...(prev[selectedProjectId] ?? []), message],
    }));
    setDrafts((prev) => ({ ...prev, [selectedProjectId]: '' }));
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col md:flex-row gap-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Message Panel</SheetTitle>
        </SheetHeader>

        {/* Project list */}
        <div className="w-20 md:w-64 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b h-14 flex items-center">
            <h3 className="font-semibold text-sm hidden md:block">Projects</h3>
            <MessageSquare className="h-5 w-5 md:hidden mx-auto" />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setActiveProjectId(project.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    selectedProjectId === project.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${project.color}20`, color: project.color }}
                  >
                    <Hash className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium truncate hidden md:block">
                    {project.name}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col h-full bg-background">
          {!activeProject ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Create a project to start a conversation</p>
            </div>
          ) : (
            <>
              <div className="h-14 border-b px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">#{activeProject.name}</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMine = message.senderId === currentUser?.id;
                    const sender = memberById.get(message.senderId);

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {!isMine && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback>{sender?.avatar ?? '?'}</AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`flex flex-col max-w-[75%] ${
                            isMine ? 'items-end' : 'items-start'
                          }`}
                        >
                          {!isMine && (
                            <span className="text-xs text-muted-foreground mb-1">
                              {sender?.name ?? 'Unknown'}
                            </span>
                          )}
                          <div
                            className={`rounded-lg p-3 text-sm ${
                              isMine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}
                          >
                            {message.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {new Date(message.sentAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t mt-auto shrink-0">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder={`Message #${activeProject.name}…`}
                    value={drafts[selectedProjectId ?? ''] ?? ''}
                    onChange={(event) =>
                      setDrafts((prev) => ({ ...prev, [selectedProjectId ?? '']: event.target.value }))
                    }
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!(drafts[selectedProjectId ?? ''] ?? '').trim()}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Chat is not persisted yet — messages reset when you close the panel.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}