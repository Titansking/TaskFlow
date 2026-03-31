import { Request, Response } from 'express';
import User from '../models/User';
import { successResponse, errorResponse } from '../utils/response';

import bcrypt from 'bcryptjs';

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password'); // Exclude password
    return res.status(200).json(successResponse(users));
  } catch (error) {
    console.error('Error in getUsers:', error);
    return res.status(500).json(errorResponse('Error fetching users'));
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }
    
    return res.status(200).json(successResponse(user));
  } catch (error) {
    console.error('Error in getUserById:', error);
    return res.status(500).json(errorResponse('Error fetching user'));
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, avatar, status } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(errorResponse('User already exists', 400));
    }

    // Hash password (default "123456" if not provided for invites?)
    // For invites, we might set a default password or require one.
    // Let's assume the UI provides one or we set a default.
    const passwordToHash = password || '123456'; 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Team Member',
      avatar: avatar || name.substring(0, 2).toUpperCase(),
      status: status || 'offline'
    });

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status
    };

    return res.status(201).json(successResponse(userResponse, 'User created successfully', 201));
  } catch (error) {
    console.error('Error in createUser:', error);
    return res.status(500).json(errorResponse('Error creating user'));
  }
};

export const getProfile = async (req: any, res: Response) => {
  try {
    // req.user is attached by authMiddleware
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }
    
    return res.status(200).json(successResponse(user));
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json(errorResponse('Error fetching profile'));
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { name, email, avatar, status } = req.body;
    
    // Create update object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;
    if (status) updateData.status = status;
    
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }
    
    return res.status(200).json(successResponse(user, 'Profile updated successfully'));
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json(errorResponse('Error updating profile'));
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { role, status } = req.body;
    
    const user = await User.findByIdAndUpdate(userId, { role, status }, { new: true });
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }
    
    return res.status(200).json(successResponse(user, 'User updated successfully'));
  } catch (error) {
    console.error('Error in updateUser:', error);
    return res.status(500).json(errorResponse('Error updating user'));
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json(errorResponse('User not found', 404));
    }
    
    return res.status(200).json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return res.status(500).json(errorResponse('Error deleting user'));
  }
};
