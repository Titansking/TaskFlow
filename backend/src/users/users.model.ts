/**
 * The User document: what a user looks like in the database.
 */
import mongoose, { Schema, type Model } from 'mongoose';
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from '../shared/types';

export interface User {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  /** Initials shown in the avatar, e.g. "AJ". */
  avatar: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    // `select: false` hides the hash unless a query explicitly asks for it —
    // the login flow is the only place that does.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'Team Member' },
    avatar: { type: String, required: true, default: 'U', maxlength: 2 },
    status: { type: String, enum: USER_STATUSES, default: 'offline' },
  },
  { timestamps: true },
);

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) ?? mongoose.model<User>('User', userSchema);