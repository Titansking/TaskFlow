import { Request, Response } from 'express';
import Activity from '../models/Activity';
import { successResponse, errorResponse } from '../utils/response';

export const getActivities = async (_req: Request, res: Response) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 });
    return res.status(200).json(successResponse(activities));
  } catch (error) {
    return res.status(500).json(errorResponse('Error fetching activities'));
  }
};

export const createActivity = async (req: Request, res: Response) => {
  try {
    const activity = await Activity.create(req.body);
    return res.status(201).json(successResponse(activity, 'Activity created successfully', 201));
  } catch (error) {
    return res.status(500).json(errorResponse('Error creating activity'));
  }
};
