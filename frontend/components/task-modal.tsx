/**
 * Create / edit task dialog.
 *
 * One form drives both modes. The form lives in an inner component that the
 * dialog renders with a `key`, so opening a different task (or switching from
 * edit to create) remounts it with fresh `useState` — no "reset the form in an
 * effect" dance, and no risk of stale field values.
 */
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import {
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Project,
  type Task,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
  type TeamMember,
} from '@/lib/types';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Resolves once the parent has persisted the change. */
  onSave: (task: Task | TaskDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  task: Task | null;
  projects: Project[];
  teamMembers: TeamMember[];
  defaultDueDate?: string;
}

/* ------------------------------- form model ------------------------------- */

interface TaskFormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  tags: string[];
}

const today = (): string => new Date().toISOString().slice(0, 10);

/** Blank form for a new task; falls back to the first project/assignee. */
const blankForm = (
  projects: Project[],
  teamMembers: TeamMember[],
  dueDate?: string,
): TaskFormState => ({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  projectId: projects[0]?.id ?? '',
  assigneeId: teamMembers[0]?.id ?? '',
  dueDate: dueDate ?? today(),
  tags: [],
});

/** Seed the form from the task being edited. */
const formFromTask = (task: Task): TaskFormState => ({
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  projectId: task.projectId,
  assigneeId: task.assigneeId,
  // The API stores a full ISO timestamp; <input type="date"> wants just the day.
  dueDate: task.dueDate.slice(0, 10),
  tags: task.tags,
});

/* ------------------------------ inner form -------------------------------- */

interface TaskFormProps {
  task: Task | null;
  projects: Project[];
  teamMembers: TeamMember[];
  defaultDueDate?: string;
  onSave: (task: Task | TaskDraft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}

function TaskForm({
  task,
  projects,
  teamMembers,
  defaultDueDate,
  onSave,
  onCancel,
  onDelete,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormState>(() =>
    task ? formFromTask(task) : blankForm(projects, teamMembers, defaultDueDate),
  );
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patch = (changes: Partial<TaskFormState>) =>
    setForm((prev) => ({ ...prev, ...changes }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    patch({ tags: [...form.tags, tag] });
    setTagInput('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.projectId || !form.assigneeId) {
      setError('Pick a project and an assignee first — every task needs both.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { tags, ...rest } = form;
      await onSave({ ...rest, tags });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not save the task');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          value={form.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Enter task title"
          required
          maxLength={160}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Enter task description"
          required
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Select value={form.status} onValueChange={(value) => patch({ status: value as TaskStatus })}>
            <SelectTrigger id="task-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(value) => patch({ priority: value as TaskPriority })}
          >
            <SelectTrigger id="task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-project">Project</Label>
          <Select value={form.projectId} onValueChange={(value) => patch({ projectId: value })}>
            <SelectTrigger id="task-project">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-assignee">Assignee</Label>
          <Select value={form.assigneeId} onValueChange={(value) => patch({ assigneeId: value })}>
            <SelectTrigger id="task-assignee">
              <SelectValue placeholder="Select an assignee" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-due-date">Due Date</Label>
        <Input
          id="task-due-date"
          type="date"
          value={form.dueDate}
          onChange={(event) => patch({ dueDate: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-tag">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="task-tag"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            placeholder="Add a tag"
            onKeyDown={(event) => {
              // Enter adds a tag instead of submitting the whole form.
              if (event.key === 'Enter') {
                event.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>

        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => patch({ tags: form.tags.filter((item) => item !== tag) })}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <DialogFooter className="flex justify-between gap-2">
        {task && onDelete && (
          <Button type="button" variant="destructive" onClick={() => void onDelete()}>
            Delete
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

/* ------------------------------- the dialog ------------------------------- */

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
  projects,
  teamMembers,
  defaultDueDate,
}: TaskModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the task details below' : 'Fill in the details to create a new task'}
          </DialogDescription>
        </DialogHeader>

        {/*
          The `key` is the whole trick: editing task A then task B (or closing
          and creating a new one) gives a different key, so React throws away
          the old form state and builds a new one from the props above.
        */}
        {isOpen && (
          <TaskForm
            key={task ? `edit:${task.id}` : `new:${defaultDueDate ?? 'today'}`}
            task={task}
            projects={projects}
            teamMembers={teamMembers}
            defaultDueDate={defaultDueDate}
            onSave={onSave}
            onCancel={onClose}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}