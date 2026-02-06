"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskModal } from "@/components/task-modal"
import { TeamModal } from "@/components/team-modal"
import { SettingsModal } from "@/components/settings-modal"
import { CalendarView } from "@/components/calendar-view"
import { AnalyticsView } from "@/components/analytics-view"
import { TimelineView } from "@/components/timeline-view"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useEffect } from "react"
import type { Task, Project, TeamMember, Activity } from "@/lib/types"
import { taskService, projectService, userService, activityService } from "@/services/data"

const initialProjects: Project[] = [
  { id: "1", name: "Website Redesign", color: "#3b82f6", members: ["1", "2", "3"] },
  { id: "2", name: "Mobile App", color: "#10b981", members: ["1", "4"] },
  { id: "3", name: "Marketing Campaign", color: "#f59e0b", members: ["2", "3", "5"] },
]

const initialTeamMembers: TeamMember[] = [
  { id: "1", name: "Alex Johnson", email: "alex@taskflow.com", role: "Admin", avatar: "AJ", status: "online" },
  { id: "2", name: "Sarah Chen", email: "sarah@taskflow.com", role: "Project Manager", avatar: "SC", status: "online" },
  { id: "3", name: "Mike Williams", email: "mike@taskflow.com", role: "Team Member", avatar: "MW", status: "away" },
  { id: "4", name: "Emma Davis", email: "emma@taskflow.com", role: "Team Member", avatar: "ED", status: "offline" },
  { id: "5", name: "James Brown", email: "james@taskflow.com", role: "Team Member", avatar: "JB", status: "online" },
]

const initialTasks: Task[] = [
  { id: "1", title: "Design homepage mockup", description: "Create high-fidelity mockups for the new homepage", status: "done", priority: "high", projectId: "1", assigneeId: "2", dueDate: "2026-01-15", tags: ["design", "urgent"], createdAt: "2026-01-10" },
  { id: "2", title: "Implement authentication", description: "Set up JWT authentication with refresh tokens", status: "in-progress", priority: "high", projectId: "2", assigneeId: "1", dueDate: "2026-01-22", tags: ["backend", "security"], createdAt: "2026-01-12" },
  { id: "3", title: "Write API documentation", description: "Document all REST API endpoints", status: "todo", priority: "medium", projectId: "2", assigneeId: "4", dueDate: "2026-01-25", tags: ["documentation"], createdAt: "2026-01-14" },
  { id: "4", title: "Social media graphics", description: "Create graphics for Q1 campaign", status: "in-progress", priority: "medium", projectId: "3", assigneeId: "3", dueDate: "2026-01-20", tags: ["design", "marketing"], createdAt: "2026-01-11" },
  { id: "5", title: "Database optimization", description: "Optimize slow queries and add indexes", status: "todo", priority: "low", projectId: "2", assigneeId: "1", dueDate: "2026-01-28", tags: ["backend", "performance"], createdAt: "2026-01-15" },
  { id: "6", title: "User testing sessions", description: "Conduct 5 user testing sessions", status: "todo", priority: "high", projectId: "1", assigneeId: "2", dueDate: "2026-01-18", tags: ["research", "ux"], createdAt: "2026-01-13" },
  { id: "7", title: "Email newsletter template", description: "Design responsive email template", status: "done", priority: "medium", projectId: "3", assigneeId: "5", dueDate: "2026-01-14", tags: ["design", "email"], createdAt: "2026-01-08" },
  { id: "8", title: "Bug fixes for checkout", description: "Fix reported bugs in checkout flow", status: "in-progress", priority: "high", projectId: "1", assigneeId: "4", dueDate: "2026-01-19", tags: ["bug", "frontend"], createdAt: "2026-01-16" },
]

const initialActivities: Activity[] = [
  { id: "1", type: "task_created", taskId: "8", userId: "1", timestamp: "2026-01-16T10:30:00", message: "created task 'Bug fixes for checkout'" },
  { id: "2", type: "task_updated", taskId: "2", userId: "1", timestamp: "2026-01-16T09:15:00", message: "moved task to In Progress" },
  { id: "3", type: "comment", taskId: "4", userId: "3", timestamp: "2026-01-15T16:45:00", message: "added a comment on 'Social media graphics'" },
  { id: "4", type: "member_joined", userId: "5", timestamp: "2026-01-15T14:00:00", message: "joined the team" },
  { id: "5", type: "task_completed", taskId: "7", userId: "5", timestamp: "2026-01-14T11:20:00", message: "completed task 'Email newsletter template'" },
]

export default function TaskFlowApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<"dashboard" | "kanban" | "calendar" | "analytics" | "timeline">("dashboard")
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [tasksData, projectsData, usersData, activitiesData] = await Promise.all([
          taskService.getTasks(),
          projectService.getProjects(),
          userService.getUsers(),
          activityService.getActivities()
        ]);
        
        setTasks(tasksData);
        setProjects(projectsData);
        setTeamMembers(usersData);
        setActivities(activitiesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesProject = !selectedProject || task.projectId === selectedProject
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesProject && matchesSearch
  })

  const handleSaveTask = async (taskData: Task | Omit<Task, "id" | "createdAt">) => {
    try {
      if ('id' in taskData) {
        // Update existing task
        const updatedTask = await taskService.updateTask(taskData.id, taskData as Task);
        setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        setEditingTask(null);
      } else {
        // Create new task
        const createdTask = await taskService.createTask(taskData);
        setTasks([createdTask, ...tasks]);
      }
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      setEditingTask(null);
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  const handleDragTask = async (taskId: string, newStatus: Task["status"]) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    
    try {
      await taskService.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error("Failed to update task status:", error);
      // Revert on error
      setTasks(previousTasks);
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className={`min-h-screen bg-background ${isDarkMode ? "dark" : ""}`}>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewTask={() => {
          setEditingTask(null)
          setIsTaskModalOpen(true)
        }}
        onOpenTeam={() => setIsTeamModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        teamMembers={teamMembers}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
      />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar
          className="hidden md:block fixed left-0 top-16 z-40 h-[calc(100vh-4rem)]"
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          currentView={currentView}
          onChangeView={setCurrentView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          taskCounts={{
            todo: tasks.filter((t) => t.status === "todo").length,
            inProgress: tasks.filter((t) => t.status === "in-progress").length,
            done: tasks.filter((t) => t.status === "done").length,
          }}
        />

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[300px]">
            <Sidebar
              className="w-full h-full border-none"
              projects={projects}
              selectedProject={selectedProject}
              onSelectProject={(id) => {
                setSelectedProject(id)
                setIsMobileMenuOpen(false)
              }}
              currentView={currentView}
              onChangeView={(view) => {
                setCurrentView(view)
                setIsMobileMenuOpen(false)
              }}
              collapsed={false}
              onToggleCollapse={() => {}}
              taskCounts={{
                todo: tasks.filter((t) => t.status === "todo").length,
                inProgress: tasks.filter((t) => t.status === "in-progress").length,
                done: tasks.filter((t) => t.status === "done").length,
              }}
            />
          </SheetContent>
        </Sheet>
        
        <main className={`flex-1 p-4 md:p-6 transition-all ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"}`}>
          {currentView === "dashboard" && (
            <Dashboard
              tasks={filteredTasks}
              projects={projects}
              teamMembers={teamMembers}
              activities={activities}
              onEditTask={handleEditTask}
              onNewTask={() => {
                setEditingTask(null)
                setIsTaskModalOpen(true)
              }}
            />
          )}
          
          {currentView === "kanban" && (
            <KanbanBoard
              tasks={filteredTasks}
              teamMembers={teamMembers}
              projects={projects}
              onDragTask={handleDragTask}
              onEditTask={handleEditTask}
              onNewTask={() => {
                setEditingTask(null)
                setIsTaskModalOpen(true)
              }}
            />
          )}
          
          {currentView === "calendar" && (
            <CalendarView
              tasks={filteredTasks}
              teamMembers={teamMembers}
              onEditTask={handleEditTask}
            />
          )}
          
          {currentView === "analytics" && (
            <AnalyticsView
              tasks={tasks}
              projects={projects}
              teamMembers={teamMembers}
            />
          )}
          
          {currentView === "timeline" && (
            <TimelineView
              activities={activities}
              tasks={tasks}
              teamMembers={teamMembers}
            />
          )}
        </main>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setEditingTask(null)
        }}
        onSave={handleSaveTask}
        onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
        task={editingTask}
        projects={projects}
        teamMembers={teamMembers}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    </div>
  )
}
