"use client"

import { Mail, MoreHorizontal, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { TeamMember } from "@/lib/types"

interface TeamModalProps {
  isOpen: boolean
  onClose: () => void
  teamMembers: TeamMember[]
}

export function TeamModal({ isOpen, onClose, teamMembers }: TeamModalProps) {
  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  }

  const roleColors = {
    Admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "Project Manager": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "Team Member": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
          <DialogDescription>
            Manage your team and invite new members
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <div className="space-y-4">
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
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColors[member.status]}`}
                  />
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={roleColors[member.role]} variant="outline">
                  {member.role}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem>Change Role</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Remove from Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
