/**
 * The Activity document: one entry in the timeline feed.
 */
import mongoose, { Schema, type Model } from 'mongoose';
import { ACTIVITY_TYPES, type ActivityType } from '../shared/types';

export interface Activity {
  type: ActivityType;
  /** Optional: activities not tied to a task, e.g. "member_joined". */
  taskId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  /** Pre-rendered sentence, e.g. "created task 'Write docs'". */
  message: string;
  createdAt: Date;
}

const activitySchema = new Schema<Activity>(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 300 },
  },
  // `updatedAt` is pointless for an append-only log, so only keep createdAt.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The timeline always reads "most recent first" — match that with an index.
activitySchema.index({ createdAt: -1 });

export const ActivityModel: Model<Activity> =
  (mongoose.models.Activity as Model<Activity>) ??
  mongoose.model<Activity>('Activity', activitySchema);