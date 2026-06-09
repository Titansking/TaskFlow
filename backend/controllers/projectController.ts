import { Request, Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';

export const getProjects = async (_req: Request, res: Response) => {
  try {
    const projects = await Project.find();
    return res.status(200).json(successResponse(projects));
  } catch (error) {
    return res.status(500).json(errorResponse('Error fetching projects'));
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.create(req.body);
    return res.status(201).json(successResponse(project, 'Project created successfully', 201));
  } catch (error) {
    return res.status(500).json(errorResponse('Error creating project'));
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json(notFoundResponse('Project not found'));
    }
    
    // Cascading delete: delete all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });
    
    return res.status(200).json(successResponse(null, 'Project and associated tasks deleted successfully'));
  } catch (error) {
    return res.status(500).json(errorResponse('Error deleting project'));
  }
};
