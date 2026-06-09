"use client"

import { useState, useEffect } from "react"
import { Send, Hash, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Project, TeamMember } from "@/lib/types"

interface MessagePanelProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  teamMembers: TeamMember[]
  currentUser: TeamMember | null
}

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: string
  projectId: string
}

export function MessagePanel({
  isOpen,
  onClose,
  projects,
  teamMembers,
  currentUser,
}: MessagePanelProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")

  // Mock messages
  useEffect(() => {
    if (selectedProject) {
      setMessages([
        {
          id: "1",
          content: "Hey team, how's the progress?",
          senderId: "1", // Assuming mock ID
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          projectId: selectedProject.id,
        },
        {
          id: "2",
          content: "We are almost done with the initial phase.",
          senderId: currentUser?.id || "current",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          projectId: selectedProject.id,
        },
      ])
    }
  }, [selectedProject, currentUser])

  useEffect(() => {
    if (isOpen && !selectedProject && projects.length > 0) {
      setSelectedProject(projects[0])
    }
  }, [isOpen, projects, selectedProject])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedProject || !currentUser) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: currentUser.id,
      timestamp: new Date().toISOString(),
      projectId: selectedProject.id,
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const getSender = (senderId: string) => {
    return teamMembers.find((m) => m.id === senderId) || currentUser
  }

  const getProjectMembers = (projectId: string) => {
    // In a real app, projects would have member IDs. 
    // For now, assuming all projects have all members or filtering if project.members exists
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    
    // If project.members exists (array of strings), filter by it
    if (project.members) {
        return teamMembers.filter(m => project.members.includes(m.id));
    }
    return teamMembers;
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col md:flex-row gap-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Message Panel</SheetTitle>
        </SheetHeader>
        {/* Sidebar - Projects List */}
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
                  onClick={() => setSelectedProject(project)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    selectedProject?.id === project.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: project.color + '20', color: project.color }}
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-background">
          {selectedProject ? (
            <>
              {/* Header */}
              <div className="h-14 border-b px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedProject.name}</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {getProjectMembers(selectedProject.id).length} members
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMe = message.senderId === currentUser?.id
                    const sender = getSender(message.senderId)

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {!isMe && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback>{sender?.avatar || "?"}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`flex flex-col max-w-[75%] ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          {!isMe && (
                            <span className="text-xs text-muted-foreground mb-1">
                              {sender?.name}
                            </span>
                          )}
                          <div
                            className={`rounded-lg p-3 text-sm ${
                              isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t mt-auto shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder={`Message #${selectedProject.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a project to start messaging</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
