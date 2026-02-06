"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Task, TeamMember } from "@/lib/types"

interface CalendarViewProps {
  tasks: Task[]
  teamMembers: TeamMember[]
  onEditTask: (task: Task) => void
}

export function CalendarView({ tasks, onEditTask }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

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
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`
    return tasks.filter((task) => task.dueDate === dateStr)
  }

  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  }

  const today = new Date()
  const isToday = (date: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === date

  // Calculate statistics (Global/Project scope to match Dashboard)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === "in-progress").length,
    completed: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t => t.status !== "done" && t.dueDate < todayStr).length
  }

  const days = []
  for (let i = 0; i < firstDayWeekday; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View your tasks in calendar format</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
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
          <div className="grid grid-cols-7 gap-px bg-border">
            {dayNames.map((day) => (
              <div
                key={day}
                className="bg-muted p-3 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const dayTasks = day ? getTasksForDate(day) : []
              return (
                <div
                  key={index}
                  className={`min-h-24 bg-background p-2 ${
                    day ? "cursor-pointer hover:bg-accent" : ""
                  } ${isToday(day ?? 0) ? "bg-accent" : ""}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium ${
                          isToday(day) ? "text-primary" : ""
                        }`}
                      >
                        {day}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => onEditTask(task)}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-xs hover:bg-secondary cursor-pointer"
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{dayTasks.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
