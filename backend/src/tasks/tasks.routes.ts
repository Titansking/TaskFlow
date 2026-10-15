/**
 * URLs for tasks. Any logged-in user can work with tasks; creating one also
 * writes an activity entry (see tasks.service.ts).
 */
import { Router } from 'express';
import { requireLogin } from '../shared/auth';
import { asyncRoute, created, ok, send } from '../shared/http';
import { check, checkId } from '../shared/validate';
import type { PaginationQuery } from '../users/users.schema';
import * as service from './tasks.service';
import { createTaskBody, listTasksQuery, updateTaskBody } from './tasks.schema';

const router = Router();

router.use(requireLogin);

router.get('/', check(listTasksQuery, 'query'), asyncRoute(async (req, res) => {
  const { projectId, status, ...pagination } = req.query as unknown as PaginationQuery & {
    projectId?: string;
    status?: never;
  };

  return send(res, ok(await service.listTasks({ projectId, status }, pagination)));
}));

router.post('/', check(createTaskBody), asyncRoute(async (req, res) => {
  return send(res, created(await service.createTask(req.body, req.user!.userId), 'Task created successfully'));
}));

router.put('/:id', checkId(), check(updateTaskBody), asyncRoute(async (req, res) => {
  return send(res, ok(await service.updateTask(req.params.id, req.body, req.user!.userId), 'Task updated successfully'));
}));

router.delete('/:id', checkId(), asyncRoute(async (req, res) => {
  await service.deleteTask(req.params.id);
  return send(res, ok(null, 'Task deleted successfully'));
}));

export default router;