import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: mongoose.Types.ObjectId;
  assigneeId: mongoose.Types.ObjectId;
  dueDate: Date;
  tags: string[];
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'done'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  tags: [{ type: String }]
}, {
  timestamps: true
});

export default mongoose.model<ITask>('Task', TaskSchema);
