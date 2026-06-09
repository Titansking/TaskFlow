import express from 'express';
import { getUsers, getUserById, createUser, getProfile, updateProfile, updateUser, deleteUser } from '../controllers/userController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = express.Router();

// 1. Get all users: Any logged-in user can view the list of team members.
router.get('/', authMiddleware, getUsers);

// 2. Create/Invite a user: Restricted to Admins and Project Managers only.
router.post('/', authMiddleware, requireRole(['Admin', 'Project Manager']), createUser);

// 3. Get profile of current logged-in user: Must be logged in.
router.get('/profile', authMiddleware, getProfile);

// 4. Update profile of current logged-in user: Must be logged in.
router.put('/profile', authMiddleware, updateProfile);

// 5. Get details of a specific user: Any logged-in user can view a team member's details.
router.get('/:id', authMiddleware, getUserById);

// 6. Update user role or status: Restricted to Admins only.
router.put('/:id', authMiddleware, requireRole(['Admin']), updateUser);

// 7. Remove/Delete user from team: Restricted to Admins only.
router.delete('/:id', authMiddleware, requireRole(['Admin']), deleteUser);

export default router;
