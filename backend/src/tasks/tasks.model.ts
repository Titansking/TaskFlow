/**
 * The Task document: what a task looks like in the database.
 */
import mongoose, { Schema, type Model } from 'mongoose';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../shared/types';

export interface Task {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: mongoose.Types.ObjectId;
  assigneeId: mongoose.Types.ObjectId;
  dueDate: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<Task>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    tags: { type: [{ type: String, trim: true }], default: [] },
  },
  { timestamps: true },
);

// The Kanban board filters by status and sorts by due date — this compound
// index lets MongoDB serve that query straight from the index.
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ projectId: 1, status: 1 });

export const TaskModel: Model<Task> =
  (mongoose.models.Task as Model<Task>) ?? mongoose.model<Task>('Task', taskSchema);