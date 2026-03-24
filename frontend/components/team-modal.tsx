import { useState } from "react"
import { Mail, MoreHorizontal, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { userService } from "@/services/data"
import type { TeamMember } from "@/lib/types"

interface TeamModalProps {
  isOpen: boolean
  onClose: () => void
  teamMembers: TeamMember[]
  onMemberAdded?: (member: TeamMember) => void
  onMemberUpdated?: (member: TeamMember) => void
  onMemberRemoved?: (memberId: string) => void
  onOpenMessages?: () => void
}

export function TeamModal({ isOpen, onClose, teamMembers, onMemberAdded, onMemberUpdated, onMemberRemoved, onOpenMessages }: TeamModalProps) {
  const [isInviting, setIsInviting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Team Member",
  })

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const updatedMember = await userService.updateUser(memberId, { role: newRole } as any);
      if (onMemberUpdated) {
        onMemberUpdated(updatedMember);
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        await userService.deleteUser(memberId);
        if (onMemberRemoved) {
          onMemberRemoved(memberId);
        }
      } catch (error) {
        console.error("Failed to remove member:", error);
      }
    }
  }

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  }

  const roleColors: Record<string, string> = {
    Admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "Project Manager": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "Team Member": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const newUser = await userService.createUser({
        ...formData,
        avatar: formData.name.substring(0, 2).toUpperCase(),
        status: "offline",
        password: "password123" // Default password
      } as any)
      
      if (onMemberAdded) {
        onMemberAdded(newUser)
      }
      setIsInviting(false)
      setFormData({ name: "", email: "", role: "Team Member" })
    } catch (error) {
      console.error("Failed to invite member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) setIsInviting(false)
      onClose()
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Team Members</DialogTitle>
          <DialogDescription>
            Manage your team and invite new members
          </DialogDescription>
        </DialogHeader>

        {!isInviting ? (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsInviting(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </div>

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
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColors[member.status] || statusColors.offline}`}
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
                    <Badge className={roleColors[member.role] || roleColors["Team Member"]} variant="outline">
                      {member.role}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/users/${member.id}`}>
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (onOpenMessages) {
                            onOpenMessages()
                            onClose()
                          } else {
                            window.location.href = `mailto:${member.email}`
                          }
                        }}>
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "Admin")}>
                                Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "Project Manager")}>
                                Project Manager
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "Team Member")}>
                                Team Member
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMember(member.id)}>
                          Remove from Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Team Member">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsInviting(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Inviting..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
