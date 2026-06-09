import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'comment' | 'member_joined';
  taskId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
}

const ActivitySchema: Schema = new Schema({
  type: { 
    type: String, 
    enum: ['task_created', 'task_updated', 'task_completed', 'comment', 'member_joined'],
    required: true
  },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
