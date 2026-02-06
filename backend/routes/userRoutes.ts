import express from 'express';
import { getUsers, createUser, getProfile, updateProfile } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUser);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;
