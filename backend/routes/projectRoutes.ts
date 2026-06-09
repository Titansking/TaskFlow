import express from 'express';
import { getProjects, createProject, deleteProject } from '../controllers/projectController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

// 1. Get all projects: Any logged-in user can view the list of projects.
router.get('/', authMiddleware, getProjects);

// 2. Create a new project: Restricted to Admins and Project Managers only.
router.post('/', authMiddleware, requireRole(['Admin', 'Project Manager']), createProject);

// 3. Delete a project: Restricted to Admins and Project Managers only.
router.delete('/:id', authMiddleware, requireRole(['Admin', 'Project Manager']), deleteProject);

export default router;
