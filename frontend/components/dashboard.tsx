"use client"

import { AlertCircle, CheckCircle2, Clock, ListTodo, Plus, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Task, Project, TeamMember, Activity } from "@/lib/types"

interface DashboardProps {
  tasks: Task[]
  projects: Project[]
  teamMembers: TeamMember[]
  activities: Activity[]
  onEditTask: (task: Task) => void
  onNewTask: () => void
}

export function Dashboard({ tasks, projects, teamMembers, activities, onEditTask, onNewTask }: DashboardProps) {
  const todoTasks = tasks.filter((t) => t.status === "todo")
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress")
  const doneTasks = tasks.filter((t) => t.status === "done")
  const overdueTasks = tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== "done")

  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0

  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: ListTodo, color: "text-blue-500" },
    { label: "In Progress", value: inProgressTasks.length, icon: Clock, color: "text-yellow-500" },
    { label: "Completed", value: doneTasks.length, icon: CheckCircle2, color: "text-green-500" },
    { label: "Overdue", value: overdueTasks.length, icon: AlertCircle, color: "text-red-500" },
  ]

  const priorityColors = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  }

  const upcomingTasks = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const getProjectName = (projectId: string) => projects.find((p) => p.id === projectId)?.name || "Unknown"
  const getProjectColor = (projectId: string) => projects.find((p) => p.id === projectId)?.color || "#888"
  const getTeamMember = (memberId: string) => teamMembers.find((m) => m.id === memberId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your project overview.
          </p>
        </div>
        <Button onClick={onNewTask} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {upcomingTasks.map((task) => {
                const assignee = getTeamMember(task.assigneeId)
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onEditTask(task)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getProjectColor(task.projectId) }}
                      />
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">{getProjectName(task.projectId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {assignee && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{assignee.avatar}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                )
              })}
              {upcomingTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No upcoming tasks</p>
              )}
            </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Completion rate across projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-3xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Overall completion</p>
              </div>
            </div>
            <div className="space-y-4">
              {projects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id)
                const projectDone = projectTasks.filter((t) => t.status === "done").length
                const projectProgress = projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </div>
                      <span className="text-muted-foreground">{projectProgress}%</span>
                    </div>
                    <Progress value={projectProgress} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => {
                const user = getTeamMember(activity.userId)
                return (
                  <div key={activity.id} className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{user?.avatar || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{user?.name}</span>{" "}
                        <span className="text-muted-foreground">{activity.message}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Your team&apos;s current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                        member.status === "online"
                          ? "bg-green-500"
                          : member.status === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
