import { Response } from 'express';
import Task from '../models/Task';
import Activity from '../models/Activity'; // Import Activity model to log updates
import { AuthenticatedRequest } from '../types/index'; // Import AuthenticatedRequest to access req.user
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';

// Get a list of all tasks, sorted by creation date (newest first)
export const getTasks = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 });
    return res.status(200).json(successResponse(tasks));
  } catch (error) {
    return res.status(500).json(errorResponse('Error fetching tasks'));
  }
};

// Create a new task in the database and log a "task created" activity
export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Creating task with body:', JSON.stringify(req.body, null, 2));
    const task = await Task.create(req.body);
    
    // Log the "task_created" activity in the database if user is logged in
    if (req.user) {
      await Activity.create({
        type: 'task_created',
        taskId: task._id,
        userId: req.user.userId,
        message: `created task '${task.title}'`
      });
    }
    
    return res.status(201).json(successResponse(task, 'Task created successfully', 201));
  } catch (error: any) {
    console.error('Error creating task:', error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(`Validation error: ${error.message}`, 400));
    }
    if (error.name === 'CastError') {
      return res.status(400).json(errorResponse(`Invalid field value: ${error.message}`, 400));
    }
    return res.status(500).json(errorResponse(`Error creating task: ${error.message}`, 500));
  }
};

// Update an existing task and log corresponding "task completed" or "task updated" activity
export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Fetch the task before making changes to compare status
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) {
      return res.status(404).json(notFoundResponse('Task not found'));
    }

    // 2. Perform the update
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) {
      return res.status(404).json(notFoundResponse('Task not found'));
    }
    
    // 3. Log activity depending on what changed
    if (req.user) {
      let activityType: 'task_updated' | 'task_completed' = 'task_updated';
      let message = `updated task '${task.title}'`;

      // If status changed to 'done', log it as completed
      if (oldTask.status !== 'done' && task.status === 'done') {
        activityType = 'task_completed';
        message = `completed task '${task.title}'`;
      } else if (oldTask.status !== task.status) {
        // If status changed to something else, log the new column it moved to
        const displayStatus = task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : task.status;
        message = `moved task '${task.title}' to ${displayStatus}`;
      }

      await Activity.create({
        type: activityType,
        taskId: task._id,
        userId: req.user.userId,
        message
      });
    }
    
    return res.status(200).json(successResponse(task, 'Task updated successfully'));
  } catch (error) {
    return res.status(500).json(errorResponse('Error updating task'));
  }
};

// Delete a task from the database
export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
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
