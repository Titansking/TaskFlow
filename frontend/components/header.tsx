"use client"

import React from "react"
// Import icons from lucide-react library
import { Bell, Menu, Moon, Plus, Search, Settings, Sun, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Import components from the UI folder
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Import dropdown menu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Import types for user and notifications
import type { TeamMember, Activity } from "@/lib/types"
import { logout } from "@/lib/session"

// Define the arguments (Props) that our Header component will receive
interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onNewTask: () => void
  onOpenTeam: () => void
  onOpenSettings: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  currentUser: TeamMember | null
  notifications: Activity[]
  onMenuToggle: () => void
}

// Header component definition
export function Header({
  searchQuery,
  onSearchChange,
  onNewTask,
  onOpenTeam,
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  notifications,
  onMenuToggle,
}: HeaderProps) {
  const router = useRouter()

  // Fall back to a guest so the avatar never renders null while the session loads
  const user: TeamMember = currentUser ?? {
    id: '',
    name: 'Guest User',
    email: '',
    role: 'Team Member',
    avatar: 'G',
    status: 'offline',
    createdAt: '',
    updatedAt: '',
  }

  return (
    <TooltipProvider>
      {/* Sticky header bar wrapper */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          
          {/* LEFT SECTION: Logo and Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button (only visible on small screens) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Menu</TooltipContent>
            </Tooltip>
            
            {/* TaskFlow branding link */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                T
              </div>
              <span className="text-xl font-bold">TaskFlow</span>
            </Link>
          </div>

          {/* MIDDLE SECTION: Search Bar */}
          <div className="flex flex-1 items-center justify-center px-4 md:px-8">
            <div className="relative w-full max-w-md hidden md:block">
              {/* Search icon inside search input */}
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* RIGHT SECTION: Quick Action Buttons and Menus */}
          <div className="flex items-center gap-2">
            
            {/* 1. New Task Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onNewTask} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">New Task</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create New Task</TooltipContent>
            </Tooltip>

            {/* 3. Team Management Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onOpenTeam} className="hidden md:inline-flex">
                  <Users className="h-5 w-5" />
                  <span className="sr-only">Team</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage Team</TooltipContent>
            </Tooltip>

            {/* 4. Notifications Dropdown Button */}
            {/* Note: We removed the Tooltip wrap here to fix the Radix trigger conflict */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {/* Show numeric badge only if there are notifications */}
                  {notifications.length > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
                      {notifications.length}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Render the notification list if any exist, otherwise show empty message */}
                {notifications.length > 0 ? (
                  notifications.map((notification) => {
                    // Safe string replace in case type is not a string
                    const rawType = notification.type || "Notification";
                    const formattedType = rawType.replace('_', ' ');

                    return (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 py-3">
                        <span className="font-medium capitalize">{formattedType}</span>
                        <span className="text-sm text-muted-foreground">
                          {notification.message}
                        </span>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 5. Dark/Light Mode Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Theme</TooltipContent>
            </Tooltip>

            {/* 6. Settings Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onOpenSettings} className="hidden md:inline-flex">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            {/* 7. User Profile Dropdown Button */}
            {/* Note: We removed the Tooltip wrap here to fix the Radix trigger conflict */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.avatar}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenTeam} className="cursor-pointer">
                  Team
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => {
                  logout();
                }}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
