import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  color: string; // Hex color code
  members: mongoose.Types.ObjectId[]; // Array of User IDs
}

const ProjectSchema: Schema = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

export default mongoose.model<IProject>('Project', ProjectSchema);
