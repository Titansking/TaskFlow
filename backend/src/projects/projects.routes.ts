/**
 * URLs for projects. Creating and deleting one is a manager-level action.
 */
import { Router } from 'express';
import { MANAGER_ROLES } from '../shared/types';
import { requireLogin, requireRole } from '../shared/auth';
import { asyncRoute, created, ok, send } from '../shared/http';
import { check, checkId } from '../shared/validate';
import { pagination, type PaginationQuery } from '../users/users.schema';
import * as service from './projects.service';
import { createProjectBody } from './projects.schema';

const router = Router();

router.use(requireLogin);

router.get('/', check(pagination, 'query'), asyncRoute(async (req, res) => {
  return send(res, ok(await service.listProjects(req.query as unknown as PaginationQuery)));
}));

router.post('/', requireRole(MANAGER_ROLES), check(createProjectBody), asyncRoute(async (req, res) => {
  return send(res, created(await service.createProject(req.body), 'Project created successfully'));
}));

router.delete('/:id', requireRole(MANAGER_ROLES), checkId(), asyncRoute(async (req, res) => {
  await service.deleteProject(req.params.id);
  return send(res, ok(null, 'Project and its tasks deleted successfully'));
}));

export default router;