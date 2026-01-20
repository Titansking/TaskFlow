"use client"

import { CheckCircle2, Edit, MessageSquare, Plus, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Activity, Task, TeamMember } from "@/lib/types"

interface TimelineViewProps {
  activities: Activity[]
  tasks: Task[]
  teamMembers: TeamMember[]
}

export function TimelineView({ activities, tasks, teamMembers }: TimelineViewProps) {
  const getTeamMember = (userId: string) => teamMembers.find((m) => m.id === userId)
  const getTask = (taskId: string) => tasks.find((t) => t.id === taskId)

  const activityIcons = {
    task_created: Plus,
    task_updated: Edit,
    task_completed: CheckCircle2,
    comment: MessageSquare,
    member_joined: UserPlus,
  }

  const activityColors = {
    task_created: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    task_updated: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
    task_completed: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    comment: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
    member_joined: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400",
  }

  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, Activity[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Timeline</h1>
        <p className="text-muted-foreground">Track all project activities and updates</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedActivities).map(([date, dayActivities]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">{date}</CardTitle>
                <CardDescription>{dayActivities.length} activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-6">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  {dayActivities.map((activity) => {
                    const user = getTeamMember(activity.userId)
                    const task = activity.taskId ? getTask(activity.taskId) : null
                    const Icon = activityIcons[activity.type]
                    return (
                      <div key={activity.id} className="relative flex gap-4 pl-10">
                        <div
                          className={`absolute left-2 flex h-5 w-5 items-center justify-center rounded-full ${activityColors[activity.type]}`}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{user?.avatar || "?"}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user?.name}</span>
                            <span className="text-muted-foreground">{activity.message}</span>
                          </div>
                          {task && (
                            <div className="ml-8 rounded-lg border bg-muted/50 p-3">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground ml-8">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>This week&apos;s highlights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activityColors.task_created}`}>
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Tasks Created</span>
                </div>
                <Badge variant="secondary">
                  {activities.filter((a) => a.type === "task_created").length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activityColors.task_completed}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Tasks Completed</span>
                </div>
                <Badge variant="secondary">
                  {activities.filter((a) => a.type === "task_completed").length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activityColors.comment}`}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Comments</span>
                </div>
                <Badge variant="secondary">
                  {activities.filter((a) => a.type === "comment").length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${activityColors.task_updated}`}>
                    <Edit className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Updates</span>
                </div>
                <Badge variant="secondary">
                  {activities.filter((a) => a.type === "task_updated").length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Active Members</CardTitle>
              <CardDescription>Top contributors this week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamMembers.slice(0, 5).map((member, index) => {
                const memberActivities = activities.filter((a) => a.userId === member.id).length
                return (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-4">
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{member.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                    <Badge variant="outline">{memberActivities} actions</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
