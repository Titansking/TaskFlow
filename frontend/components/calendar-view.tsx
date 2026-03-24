"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Clock, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Task, TeamMember, Project } from "@/lib/types"

interface CalendarViewProps {
  tasks: Task[]
  teamMembers: TeamMember[]
  projects: Project[]
  onEditTask: (task: Task) => void
  onNewTask: (defaultDate?: string) => void
}

export function CalendarView({ tasks, teamMembers, projects, onEditTask, onNewTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getTasksForDate = (date: number) => {
    const targetDate = new Date(year, month, date)
    return tasks.filter((task) => {
      const taskDate = new Date(task.dueDate)
      return (
        taskDate.getFullYear() === targetDate.getFullYear() &&
        taskDate.getMonth() === targetDate.getMonth() &&
        taskDate.getDate() === targetDate.getDate()
      )
    })
  }

  const statusConfig = {
    todo: { color: "bg-slate-400", icon: Circle, label: "To Do", textColor: "text-slate-600 dark:text-slate-400" },
    "in-progress": { color: "bg-blue-500", icon: Clock, label: "In Progress", textColor: "text-blue-600 dark:text-blue-400" },
    done: { color: "bg-emerald-500", icon: CheckCircle2, label: "Done", textColor: "text-emerald-600 dark:text-emerald-400" },
  }

  const priorityColors = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-green-500",
  }

  const today = new Date()
  const isToday = (date: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === date

  const getProjectColor = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.color || "#888"

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || "Unknown"

  const getAssigneeName = (assigneeId: string) =>
    teamMembers.find((m) => m.id === assigneeId)?.name || ""

  const formatDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  // Stats
  const todayStr = formatDateStr(today.getDate())
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "done").length,
  }

  const days: (number | null)[] = []
  for (let i = 0; i < firstDayWeekday; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">View and manage tasks by date</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => onNewTask()} className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Legend */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-slate-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Circle className="h-3 w-3 text-slate-400" />
                To Do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todo}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-3 w-3 text-blue-500" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Done
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {monthNames[month]} {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="bg-muted p-3 text-center text-sm font-semibold"
                >
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                const dayTasks = day ? getTasksForDate(day) : []
                const todoDots = dayTasks.filter(t => t.status === "todo").length
                const ipDots = dayTasks.filter(t => t.status === "in-progress").length
                const doneDots = dayTasks.filter(t => t.status === "done").length

                return (
                  <div
                    key={index}
                    className={`min-h-28 bg-background p-2 transition-colors relative group ${
                      day ? "cursor-pointer hover:bg-accent/50" : ""
                    } ${isToday(day ?? 0) ? "bg-primary/5 ring-2 ring-primary/20 ring-inset" : ""}`}
                    onClick={() => {
                      if (day && dayTasks.length === 0) {
                        onNewTask(formatDateStr(day))
                      }
                    }}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-medium inline-flex items-center justify-center h-7 w-7 rounded-full ${
                              isToday(day)
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                          >
                            {day}
                          </span>
                          {/* Status summary dots */}
                          {dayTasks.length > 0 && (
                            <div className="flex gap-0.5">
                              {todoDots > 0 && (
                                <span className="flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                  {todoDots}
                                </span>
                              )}
                              {ipDots > 0 && (
                                <span className="flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-[9px] font-bold text-blue-600 dark:text-blue-300">
                                  {ipDots}
                                </span>
                              )}
                              {doneDots > 0 && (
                                <span className="flex items-center justify-center h-4 min-w-4 px-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
                                  {doneDots}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {dayTasks.slice(0, expandedDay === day ? dayTasks.length : 3).map((task) => {
                            const config = statusConfig[task.status]
                            const StatusIcon = config.icon
                            return (
                              <Tooltip key={task.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onEditTask(task)
                                    }}
                                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-secondary cursor-pointer border-l-2 ${priorityColors[task.priority]} transition-colors`}
                                  >
                                    <StatusIcon className={`h-3 w-3 shrink-0 ${config.textColor}`} />
                                    <span className={`truncate ${task.status === "done" ? "line-through opacity-60" : ""}`}>
                                      {task.title}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold">{task.title}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Badge variant="outline" className="text-[10px]">
                                        {config.label}
                                      </Badge>
                                      <span className="text-muted-foreground">{task.priority} priority</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {getProjectName(task.projectId)}
                                      {getAssigneeName(task.assigneeId) && ` · ${getAssigneeName(task.assigneeId)}`}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                          {dayTasks.length > 3 && expandedDay !== day && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedDay(day)
                              }}
                              className="text-[10px] text-primary font-medium pl-1.5 cursor-pointer hover:underline"
                            >
                              +{dayTasks.length - 3} more
                            </div>
                          )}
                          {dayTasks.length > 3 && expandedDay === day && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedDay(null)
                              }}
                              className="text-[10px] text-primary font-medium pl-1.5 cursor-pointer hover:underline"
                            >
                              Show less
                            </div>
                          )}
                        </div>
                        {/* Add task button */}
                        {dayTasks.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                        {dayTasks.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onNewTask(formatDateStr(day))
                            }}
                            className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                          >
                            <Plus className="h-3 w-3 text-primary" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
