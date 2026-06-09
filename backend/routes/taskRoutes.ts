import express from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 1. Get all tasks: Must be logged in to view tasks.
router.get('/', authMiddleware, getTasks);

// 2. Create a new task: Must be logged in to create a task.
router.post('/', authMiddleware, createTask);

// 3. Update an existing task: Must be logged in to update a task (e.g. change status or details).
router.put('/:id', authMiddleware, updateTask);

// 4. Delete a task: Must be logged in to delete a task.
router.delete('/:id', authMiddleware, deleteTask);

export default router;
