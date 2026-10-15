/**
 * URLs for the activity (timeline) feed.
 */
import { Router } from 'express';
import { requireLogin } from '../shared/auth';
import { asyncRoute, created, ok, send } from '../shared/http';
import { check } from '../shared/validate';
import { pagination, type PaginationQuery } from '../users/users.schema';
import * as service from './activities.service';
import { createActivityBody } from './activities.schema';

const router = Router();

router.use(requireLogin);

router.get('/', check(pagination, 'query'), asyncRoute(async (req, res) => {
  return send(res, ok(await service.listActivities(req.query as unknown as PaginationQuery)));
}));

router.post('/', check(createActivityBody), asyncRoute(async (req, res) => {
  return send(res, created(
    await service.createActivity(req.body, req.user!.userId),
    'Activity created successfully',
  ));
}));

export default router;