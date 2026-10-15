/**
 * TaskFlow — the app shell.
 *
 * This file is intentionally just layout and wiring:
 *
 *   useTaskFlowData()  ->  all server state + actions (see hooks/)
 *   useTheme()         ->  dark mode
 *
 * Everything below picks a view, opens the right modal, and renders. If you
 * want to know what TaskFlow *does*, read `hooks/useTaskFlowData.ts`; if you
 * want to know what it *looks like*, read this file.
 */
'use client';

import { useState } from 'react';
import { AnalyticsView } from '@/components/analytics-view';
import { CalendarView } from '@/components/calendar-view';
import { Dashboard } from '@/components/dashboard';
import { Header } from '@/components/header';
import { KanbanBoard } from '@/components/kanban-board';
import { MessagePanel } from '@/components/message-panel';
import { ProjectModal } from '@/components/project-modal';
import { SettingsModal } from '@/components/settings-modal';
import { Sidebar } from '@/components/sidebar';
import { TaskModal } from '@/components/task-modal';
import { TeamModal } from '@/components/team-modal';
import { TimelineView } from '@/components/timeline-view';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useTaskFlowData } from '@/hooks/useTaskFlowData';
import { useTheme } from '@/hooks/useTheme';
import type { Task } from '@/lib/types';
import type { ViewId } from '@/lib/types';

/** Modals are mutually exclusive, so one field is enough instead of five booleans. */
type OpenModal = 'task' | 'team' | 'settings' | 'project' | 'messages' | null;

export default function TaskFlowApp() {
  const data = useTaskFlowData();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [view, setView] = useState<ViewId>('dashboard');
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ------------------------------ shortcuts ------------------------------- */

  const openNewTask = (dueDate?: string) => {
    setEditingTask(null);
    setDefaultDueDate(dueDate);
    setOpenModal('task');
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultDueDate(undefined);
    setOpenModal('task');
  };

  const closeTaskModal = () => {
    setOpenModal(null);
    setEditingTask(null);
    setDefaultDueDate(undefined);
  };

  /* --------------------------- sidebar (shared) --------------------------- */

  const sidebarProps = {
    projects: data.projects,
    selectedProject: data.selectedProject,
    onSelectProject: data.setSelectedProject,
    currentView: view,
    taskCounts: data.taskCounts,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={data.searchQuery}
        onSearchChange={data.setSearchQuery}
        onNewTask={() => openNewTask()}
        onOpenTeam={() => setOpenModal('team')}
        onOpenSettings={() => setOpenModal('settings')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        currentUser={data.currentUser}
        notifications={data.activities.slice(0, 5)}
        onMenuToggle={() => setIsMobileMenuOpen(true)}
      />

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar
          {...sidebarProps}
          className="hidden md:block fixed left-0 top-16 z-40 h-[calc(100vh-4rem)]"
          onChangeView={setView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          onAddProject={data.canManageTeam ? () => setOpenModal('project') : undefined}
          onDeleteProject={data.canManageTeam ? data.removeProject : undefined}
        />

        {/* Mobile sidebar — same props, closes itself after each tap */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[300px]">
            <Sidebar
              {...sidebarProps}
              className="w-full h-full border-none"
              onChangeView={(next) => {
                setView(next);
                setIsMobileMenuOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => undefined}
              onAddProject={
                data.canManageTeam
                  ? () => {
                      setIsMobileMenuOpen(false);
                      setOpenModal('project');
                    }
                  : undefined
              }
              onDeleteProject={
                data.canManageTeam
                  ? async (projectId: string) => {
                      await data.removeProject(projectId);
                      setIsMobileMenuOpen(false);
                    }
                  : undefined
              }
            />
          </SheetContent>
        </Sheet>

        <main className={`flex-1 p-4 md:p-6 transition-all ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          {view === 'dashboard' && (
            <Dashboard
              tasks={data.filteredTasks}
              projects={data.projects}
              teamMembers={data.teamMembers}
              activities={data.activities}
              onEditTask={openEditTask}
              onNewTask={() => openNewTask()}
            />
          )}

          {view === 'kanban' && (
            <KanbanBoard
              tasks={data.filteredTasks}
              teamMembers={data.teamMembers}
              projects={data.projects}
              onDragTask={data.moveTask}
              onEditTask={openEditTask}
              onNewTask={() => openNewTask()}
            />
          )}

          {view === 'calendar' && (
            <CalendarView
              tasks={data.filteredTasks}
              teamMembers={data.teamMembers}
              projects={data.projects}
              onEditTask={openEditTask}
              onNewTask={openNewTask}
            />
          )}

          {view === 'analytics' && (
            <AnalyticsView
              tasks={data.tasks}
              projects={data.projects}
              teamMembers={data.teamMembers}
              activities={data.activities}
            />
          )}

          {view === 'timeline' && (
            <TimelineView
              activities={data.activities}
              tasks={data.tasks}
              teamMembers={data.teamMembers}
            />
          )}
        </main>
      </div>

      {data.error && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg"
        >
          {data.error}
          <button type="button" className="underline" onClick={data.dismissError}>
            Dismiss
          </button>
        </div>
      )}

      <TaskModal
        isOpen={openModal === 'task'}
        onClose={closeTaskModal}
        onSave={async (task) => {
          await data.saveTask(task);
          closeTaskModal();
        }}
        onDelete={
          editingTask
            ? async () => {
                await data.removeTask(editingTask.id);
                closeTaskModal();
              }
            : undefined
        }
        task={editingTask}
        projects={data.projects}
        teamMembers={data.teamMembers}
        defaultDueDate={defaultDueDate}
      />

      <TeamModal
        isOpen={openModal === 'team'}
        onClose={() => setOpenModal(null)}
        teamMembers={data.teamMembers}
        currentUser={data.currentUser}
        canManageTeam={data.canManageTeam}
        isAdmin={data.isAdmin}
        onMemberAdded={data.addMember}
        onMemberRoleChange={data.changeMemberRole}
        onMemberRemoved={data.removeMember}
        onOpenMessages={() => setOpenModal('messages')}
      />

      <SettingsModal
        isOpen={openModal === 'settings'}
        onClose={() => setOpenModal(null)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <MessagePanel
        isOpen={openModal === 'messages'}
        onClose={() => setOpenModal(null)}
        projects={data.projects}
        teamMembers={data.teamMembers}
        currentUser={data.currentUser}
      />

      <ProjectModal
        isOpen={openModal === 'project'}
        onClose={() => setOpenModal(null)}
        onSave={async (project) => {
          await data.createProject(project);
          setOpenModal(null);
        }}
      />
    </div>
  );
}