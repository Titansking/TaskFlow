"use client"

import { useState } from "react"

import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  Home,
  Layers,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  onAddProject?: () => void
  onDeleteProject?: (projectId: string) => void
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
  onAddProject,
  onDeleteProject,
  taskCounts,
  className,
}: SidebarProps & { className?: string }) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

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
            {!collapsed ? (
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Projects
                </h3>
                {onAddProject && (
                  <button
                    onClick={onAddProject}
                    className="h-5 w-5 rounded flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            ) : (
              onAddProject && (
                <button
                  onClick={onAddProject}
                  className="w-full flex items-center justify-center py-1 hover:bg-accent rounded transition-colors"
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              )
            )}
            <Button
              variant={selectedProject === null ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3", collapsed && "justify-center px-2")}
              onClick={() => onSelectProject(null)}
            >
              <Folder className="h-4 w-4" />
              {!collapsed && <span>All Projects</span>}
            </Button>
            <ScrollArea className={projects.length > 4 ? "h-[176px]" : ""}>
              <div className="space-y-0.5">
                {projects.map((project) => (
                  <div key={project.id} className="group relative">
                    <Button
                      variant={selectedProject === project.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 pr-8",
                        collapsed && "justify-center px-2 pr-2",
                        confirmingDeleteId === project.id && "border border-destructive/50 bg-destructive/5"
                      )}
                      onClick={() => {
                        if (confirmingDeleteId === project.id) {
                          setConfirmingDeleteId(null)
                        }
                        onSelectProject(project.id)
                        setConfirmingDeleteId(null)
                      }}
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      {!collapsed && (
                        confirmingDeleteId === project.id ? (
                          <span className="text-destructive text-xs font-medium">Delete this project?</span>
                        ) : (
                          <span className="truncate">{project.name}</span>
                        )
                      )}
                    </Button>
                    {!collapsed && onDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirmingDeleteId === project.id) {
                            onDeleteProject(project.id)
                            setConfirmingDeleteId(null)
                          } else {
                            setConfirmingDeleteId(project.id)
                          }
                        }}
                        className={cn(
                          "absolute right-1 top-1/2 -translate-y-1/2 h-6 rounded flex items-center justify-center transition-all",
                          confirmingDeleteId === project.id
                            ? "opacity-100 bg-destructive text-destructive-foreground px-2 text-xs font-medium"
                            : "w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                        )}
                      >
                        {confirmingDeleteId === project.id ? (
                          "Yes"
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
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
