import express from 'express';
import { getActivities, createActivity } from '../controllers/activityController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 1. Get all activities (timeline updates): Must be logged in to view activities.
router.get('/', authMiddleware, getActivities);

// 2. Create an activity: Must be logged in to log activities manually.
router.post('/', authMiddleware, createActivity);

export default router;
