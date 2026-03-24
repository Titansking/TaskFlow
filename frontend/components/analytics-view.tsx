"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Task, Project, TeamMember, Activity } from "@/lib/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  Legend,
} from "recharts"

interface AnalyticsViewProps {
  tasks: Task[]
  projects: Project[]
  teamMembers: TeamMember[]
  activities: Activity[]
}

export function AnalyticsView({ tasks, projects, teamMembers, activities }: AnalyticsViewProps) {
  const todoTasks = tasks.filter((t) => t.status === "todo").length
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length
  const doneTasks = tasks.filter((t) => t.status === "done").length

  const statusData = [
    { name: "To Do", value: todoTasks, color: "#64748b" },
    { name: "In Progress", value: inProgressTasks, color: "#3b82f6" },
    { name: "Done", value: doneTasks, color: "#22c55e" },
  ]

  const priorityData = [
    { name: "High", value: tasks.filter((t) => t.priority === "high").length, color: "#ef4444" },
    { name: "Medium", value: tasks.filter((t) => t.priority === "medium").length, color: "#f59e0b" },
    { name: "Low", value: tasks.filter((t) => t.priority === "low").length, color: "#22c55e" },
  ]

  const projectData = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id)
    const completed = projectTasks.filter((t) => t.status === "done").length
    return {
      name: project.name,
      total: projectTasks.length,
      completed,
      color: project.color,
    }
  })

  const memberData = teamMembers.map((member) => {
    const memberTasks = tasks.filter((t) => t.assigneeId === member.id)
    const completed = memberTasks.filter((t) => t.status === "done").length
    return {
      name: member.name,
      avatar: member.avatar,
      total: memberTasks.length,
      completed,
      inProgress: memberTasks.filter((t) => t.status === "in-progress").length,
    }
  })

  // Calculate weekly data derived from activities
  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d)
    }
    return days
  }

  const weeklyData = getLast7Days().map(day => {
    const dayStr = day.toLocaleDateString()
    const dayName = day.toLocaleDateString("en-US", { weekday: "short" })
    
    const created = activities.filter(a => 
      a.type === "task_created" && 
      new Date(a.timestamp).toLocaleDateString() === dayStr
    ).length

    const completed = activities.filter(a => 
      a.type === "task_completed" && 
      new Date(a.timestamp).toLocaleDateString() === dayStr
    ).length

    return {
      day: dayName,
      created,
      completed
    }
  })

  const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0
  const overdueCount = tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== "done").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track your team&apos;s productivity and progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter((m) => m.status === "online").length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {teamMembers.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Distribution of tasks across statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Priority distribution across all tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Tasks completed and created over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: "#22c55e" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Completion rates by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectData.map((project) => {
                const progress = project.total > 0 ? Math.round((project.completed / project.total) * 100) : 0
                return (
                  <div key={project.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-sm font-medium">{project.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {project.completed}/{project.total} tasks
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Individual task metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberData.map((member) => (
                <div key={member.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.total} tasks assigned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {member.completed} done
                    </Badge>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {member.inProgress} active
                    </Badge>
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
