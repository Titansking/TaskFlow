export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  projectId: string
  assigneeId: string
  dueDate: string
  tags: string[]
  createdAt: string
}

export interface Project {
  id: string
  name: string
  color: string
  members: string[]
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: "Admin" | "Project Manager" | "Team Member"
  avatar: string
  status: "online" | "away" | "offline"
}

export interface Activity {
  id: string
  type: "task_created" | "task_updated" | "task_completed" | "comment" | "member_joined"
  taskId?: string
  userId: string
  timestamp: string
  message: string
}
