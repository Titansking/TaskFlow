import { Request, Response } from 'express';
import Task from '../models/Task';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';

export const getTasks = async (_req: Request, res: Response) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 });
    return res.status(200).json(successResponse(tasks));
  } catch (error) {
    return res.status(500).json(errorResponse('Error fetching tasks'));
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.create(req.body);
    return res.status(201).json(successResponse(task, 'Task created successfully', 201));
  } catch (error) {
    return res.status(500).json(errorResponse('Error creating task'));
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!task) {
      return res.status(404).json(notFoundResponse('Task not found'));
    }
    
    return res.status(200).json(successResponse(task, 'Task updated successfully'));
  } catch (error) {
    return res.status(500).json(errorResponse('Error updating task'));
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json(notFoundResponse('Task not found'));
    }
    
    return res.status(200).json(successResponse(null, 'Task deleted successfully'));
  } catch (error) {
    return res.status(500).json(errorResponse('Error deleting task'));
  }
};
