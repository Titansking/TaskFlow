import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types/index';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  // Mongoose handles _id
}

// Check if we need to extend IUser from types/index or redefine. 
// The types/index IUser has _id: string. 
// Let's create a schema that matches the frontend requirements.

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Project Manager', 'Team Member'], 
    default: 'Team Member' 
  },
  avatar: { type: String, required: true }, // Initials like "AJ"
  status: { 
    type: String, 
    enum: ['online', 'away', 'offline'], 
    default: 'offline' 
  },
}, {
  timestamps: true
});

export default mongoose.model<IUserDocument>('User', UserSchema);
