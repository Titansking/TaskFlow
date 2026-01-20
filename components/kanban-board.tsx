"use client"

import React from "react"

import { useState } from "react"
import { Calendar, GripVertical, MoreHorizontal, Plus, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task, TeamMember, Project } from "@/lib/types"

interface KanbanBoardProps {
  tasks: Task[]
  teamMembers: TeamMember[]
  projects: Project[]
  onDragTask: (taskId: string, newStatus: Task["status"]) => void
  onEditTask: (task: Task) => void
  onNewTask: () => void
}

const columns: { id: Task["status"]; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-slate-500" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
]

export function KanbanBoard({ tasks, teamMembers, projects, onDragTask, onEditTask, onNewTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<Task["status"] | null>(null)

  const getTeamMember = (memberId: string) => teamMembers.find((m) => m.id === memberId)
  const getProject = (projectId: string) => projects.find((p) => p.id === projectId)

  const priorityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnId: Task["status"]) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnId: Task["status"]) => {
    e.preventDefault()
    if (draggedTask) {
      onDragTask(draggedTask, columnId)
    }
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">Drag and drop tasks to update their status</p>
        </div>
        <Button onClick={onNewTask} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id)
          return (
            <div
              key={column.id}
              className={`rounded-lg border-2 transition-colors ${
                dragOverColumn === column.id ? "border-primary bg-accent" : "border-transparent"
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${column.color}`} />
                      <CardTitle className="text-lg">{column.title}</CardTitle>
                    </div>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnTasks.map((task) => {
                    const assignee = getTeamMember(task.assigneeId)
                    const project = getProject(task.projectId)
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`rounded-lg border bg-card p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                          draggedTask === task.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: project?.color }}
                            />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditTask(task)}>
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDragTask(task.id, "todo")}>
                                Move to To Do
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDragTask(task.id, "in-progress")}>
                                Move to In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDragTask(task.id, "done")}>
                                Move to Done
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-2 cursor-pointer" onClick={() => onEditTask(task)}>
                          <h4 className="font-medium leading-tight">{task.title}</h4>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs gap-1">
                              <Tag className="h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{task.tags.length - 2}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={priorityColors[task.priority]} variant="outline">
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex items-center gap-1 text-xs ${
                                isOverdue(task.dueDate) && task.status !== "done"
                                  ? "text-red-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            {assignee && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{assignee.avatar}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <p className="text-sm">No tasks</p>
                      <Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={onNewTask}>
                        <Plus className="h-3 w-3" />
                        Add Task
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
