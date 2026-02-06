"use client"

import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  Home,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/types"

interface SidebarProps {
  projects: Project[]
  selectedProject: string | null
  onSelectProject: (projectId: string | null) => void
  currentView: "dashboard" | "kanban" | "calendar" | "analytics" | "timeline"
  onChangeView: (view: "dashboard" | "kanban" | "calendar" | "analytics" | "timeline") => void
  collapsed: boolean
  onToggleCollapse: () => void
  taskCounts: {
    todo: number
    inProgress: number
    done: number
  }
}

export function Sidebar({
  projects,
  selectedProject,
  onSelectProject,
  currentView,
  onChangeView,
  collapsed,
  onToggleCollapse,
  taskCounts,
  className,
}: SidebarProps & { className?: string }) {
  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: Home },
    { id: "kanban" as const, label: "Kanban Board", icon: Layers },
    { id: "calendar" as const, label: "Calendar", icon: Calendar },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { id: "timeline" as const, label: "Timeline", icon: Clock },
  ]

  return (
    <aside
      className={cn(
        "border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 p-4">
          <div className="space-y-1">
            {!collapsed && (
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </h3>
            )}
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")}
                onClick={() => onChangeView(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            {!collapsed && (
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Projects
              </h3>
            )}
            <Button
              variant={selectedProject === null ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")}
              onClick={() => onSelectProject(null)}
            >
              <Folder className="h-4 w-4" />
              {!collapsed && <span>All Projects</span>}
            </Button>
            {projects.map((project) => (
              <Button
                key={project.id}
                variant={selectedProject === project.id ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")}
                onClick={() => onSelectProject(project.id)}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                {!collapsed && <span className="truncate">{project.name}</span>}
              </Button>
            ))}
          </div>

          {!collapsed && (
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Task Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To Do</span>
                  <span className="font-medium">{taskCounts.todo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">In Progress</span>
                  <span className="font-medium">{taskCounts.inProgress}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Done</span>
                  <span className="font-medium">{taskCounts.done}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
