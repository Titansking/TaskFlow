"use client"

import { Bell, Moon, Plus, Search, Settings, Sun, Users, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { TeamMember } from "@/lib/types"

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onNewTask: () => void
  onOpenTeam: () => void
  onOpenSettings: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  teamMembers: TeamMember[]
  onMenuToggle: () => void
}

export function Header({
  searchQuery,
  onSearchChange,
  onNewTask,
  onOpenTeam,
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode,
  teamMembers,
  onMenuToggle,
}: HeaderProps) {
  const currentUser = teamMembers[0] || {
    id: "guest",
    name: "Guest User",
    email: "guest@example.com",
    role: "Team Member",
    avatar: "G",
    status: "offline"
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              T
            </div>
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 md:px-8">
          <div className="relative w-full max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onNewTask} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">New Task</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={onOpenTeam} className="hidden md:inline-flex">
            <Users className="h-5 w-5" />
            <span className="sr-only">Team</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  3
                </Badge>
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">New task assigned</span>
                <span className="text-sm text-muted-foreground">
                  {"You've been assigned to 'Bug fixes for checkout'"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Comment on your task</span>
                <span className="text-sm text-muted-foreground">
                  Sarah commented on &apos;Design homepage mockup&apos;
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Task due tomorrow</span>
                <span className="text-sm text-muted-foreground">
                  &apos;User testing sessions&apos; is due tomorrow
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={onOpenSettings} className="hidden md:inline-flex">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {currentUser.avatar}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{currentUser.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {currentUser.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = "/profile"}>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
