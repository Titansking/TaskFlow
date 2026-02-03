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
