/**
 * URLs for accounts: logging in, the team directory and profile edits.
 *
 * Mounted twice, so the full API is visible in `app.ts`:
 *   /api/auth   -> authRoutes
 *   /api/users  -> userRoutes
 *
 * Reading this file top to bottom is the fastest way to learn the feature:
 * every line is `METHOD /path  [guards]  -> handler`.
 */
import { Router } from 'express';
import { MANAGER_ROLES } from '../shared/types';
import { requireLogin, requireRole } from '../shared/auth';
import { created, ok, send, asyncRoute } from '../shared/http';
import { check, checkId } from '../shared/validate';
import * as service from './users.service';
import {
  createUserBody,
  loginBody,
  pagination,
  registerBody,
  updateProfileBody,
  updateUserBody,
  type PaginationQuery,
} from './users.schema';

/* --------------------------- /api/auth ------------------------------------ */

export const authRoutes = Router();

authRoutes.post('/register', check(registerBody), asyncRoute(async (req, res) => {
  return send(res, created(await service.register(req.body), 'Registration successful'));
}));

authRoutes.post('/login', check(loginBody), asyncRoute(async (req, res) => {
  return send(res, ok(await service.login(req.body), 'Login successful'));
}));

/* --------------------------- /api/users ----------------------------------- */

export const userRoutes = Router();

userRoutes.use(requireLogin); // everything below needs a logged-in user

// The signed-in user's own profile. Declared before `/:id` so that the literal
// path "profile" is never mistaken for an id.
userRoutes.get('/profile', asyncRoute(async (req, res) => {
  return send(res, ok(await service.findUserById(req.user!.userId)));
}));

userRoutes.put('/profile', check(updateProfileBody), asyncRoute(async (req, res) => {
  return send(res, ok(await service.updateOwnProfile(req.user!.userId, req.body), 'Profile updated successfully'));
}));

// Team directory
userRoutes.get('/', check(pagination, 'query'), asyncRoute(async (req, res) => {
  return send(res, ok(await service.listUsers(req.query as unknown as PaginationQuery)));
}));

userRoutes.post('/', requireRole(MANAGER_ROLES), check(createUserBody), asyncRoute(async (req, res) => {
  return send(res, created(await service.createUser(req.body), 'User created successfully'));
}));

userRoutes.get('/:id', checkId(), asyncRoute(async (req, res) => {
  return send(res, ok(await service.findUserById(req.params.id)));
}));

// Admin-only management
userRoutes.put('/:id', requireRole(['Admin']), checkId(), check(updateUserBody), asyncRoute(async (req, res) => {
  return send(res, ok(await service.updateUser(req.params.id, req.body), 'User updated successfully'));
}));

userRoutes.delete('/:id', requireRole(['Admin']), checkId(), asyncRoute(async (req, res) => {
  await service.deleteUser(req.params.id);
  return send(res, ok(null, 'User deleted successfully'));
}));