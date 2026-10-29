/**
 * Activity feed rules. Read-only apart from the manual entries a client may
 * add (comments, member joins).
 */
import { listOptions, paginate, toRawObject } from '../shared/http';
import type { ActivityDto, ActivityType, PageDto } from '../shared/types';
import { ActivityModel, type Activity } from './activities.model';
import type { CreateActivityBody } from './activities.schema';
import type { PaginationQuery } from '../users/users.schema';

/** Mongo document -> JSON: ids become strings, an absent taskId stays absent. */
const toDto = (doc: object): ActivityDto => {
  const raw = toRawObject(doc);

  return {
    _id: String(raw._id),
    type: raw.type as ActivityType,
    taskId: raw.taskId == null ? undefined : String(raw.taskId),
    userId: String(raw.userId),
    message: raw.message as string,
    createdAt: raw.createdAt as Date,
  };
};

export const listActivities = async (query: PaginationQuery): Promise<PageDto<ActivityDto>> => {
  // The timeline always reads newest first, so the client cannot change it.
  const page = await paginate<Activity>(
    ActivityModel,
    {},
    listOptions({ ...query, sortBy: 'createdAt', sortOrder: 'desc' }),
  );

  return { ...page, items: page.items.map((doc) => toDto(doc as object)) };
};

/**
 * The `userId` always comes from the JWT, never from the request body — a
 * client must not be able to write an activity on someone else's behalf.
 */
export const createActivity = async (body: CreateActivityBody, actorId: string): Promise<ActivityDto> => {
  const activity = await ActivityModel.create({ ...body, userId: actorId });
  return toDto(activity);
};