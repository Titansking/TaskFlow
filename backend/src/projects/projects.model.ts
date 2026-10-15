/**
 * The Project document: what a project looks like in the database.
 */
import mongoose, { Schema, type Model } from 'mongoose';

export interface Project {
  name: string;
  /** Hex colour used to tint the project chip across the UI, e.g. "#3b82f6". */
  color: string;
  /** User ids that belong to this project. */
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<Project>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    color: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
    members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { timestamps: true },
);

export const ProjectModel: Model<Project> =
  (mongoose.models.Project as Model<Project>) ??
  mongoose.model<Project>('Project', projectSchema);