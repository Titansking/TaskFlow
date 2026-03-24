"use client"

import { useState, useEffect } from "react"
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
import { MessagePanel } from "@/components/message-panel"
import { ProjectModal } from "@/components/project-modal"
import type { Task, Project, TeamMember, Activity } from "@/lib/types"
import { taskService, projectService, userService, activityService } from "@/services/data"
import { authService } from "@/services/auth"

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
  const [isMessagePanelOpen, setIsMessagePanelOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>(undefined)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)

  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)

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
        
        // set current user
        const user = authService.getCurrentUser();
        setCurrentUser(user);

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

  const handleCreateProject = async (projectData: Omit<Project, 'id'>) => {
    try {
      const newProject = await projectService.createProject(projectData)
      setProjects([...projects, newProject])
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }
  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId)
      setProjects(projects.filter(p => p.id !== projectId))
      if (selectedProject === projectId) {
        setSelectedProject(null)
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
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
        onOpenMessages={() => setIsMessagePanelOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        teamMembers={teamMembers}
        currentUser={currentUser}
        notifications={activities.slice(0, 5)}
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
          onAddProject={() => setIsProjectModalOpen(true)}
          onDeleteProject={handleDeleteProject}
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
              onAddProject={() => {
                setIsProjectModalOpen(true)
                setIsMobileMenuOpen(false)
              }}
              onDeleteProject={handleDeleteProject}
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
              projects={projects}
              onEditTask={handleEditTask}
              onNewTask={(date?: string) => {
                setEditingTask(null)
                setDefaultDueDate(date)
                setIsTaskModalOpen(true)
              }}
            />
          )}
          
          {currentView === "analytics" && (
            <AnalyticsView
              tasks={tasks}
              projects={projects}
              teamMembers={teamMembers}
              activities={activities}
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
          setDefaultDueDate(undefined)
        }}
        onSave={handleSaveTask}
        onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
        task={editingTask}
        projects={projects}
        teamMembers={teamMembers}
        defaultDueDate={defaultDueDate}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        onMemberAdded={(newMember) => setTeamMembers([...teamMembers, newMember])}
        onMemberUpdated={(updatedMember) => setTeamMembers(teamMembers.map(m => m.id === updatedMember.id ? updatedMember : m))}
        onMemberRemoved={(memberId) => setTeamMembers(teamMembers.filter(m => m.id !== memberId))}
        onOpenMessages={() => setIsMessagePanelOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <MessagePanel
        isOpen={isMessagePanelOpen}
        onClose={() => setIsMessagePanelOpen(false)}
        projects={projects}
        teamMembers={teamMembers}
        currentUser={currentUser}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleCreateProject}
      />
    </div>
  )
}
