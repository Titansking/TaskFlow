import { Request, Response } from 'express';
import User from '../models/User';
import { successResponse, errorResponse } from '../utils/response';

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    return res.status(200).json(successResponse(users));
  } catch (error) {
    return res.status(500).json(errorResponse('Error fetching users'));
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await User.create(req.body);
    return res.status(201).json(successResponse(user, 'User created successfully', 201));
  } catch (error) {
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
    return res.status(500).json(errorResponse('Error updating profile'));
  }
};
