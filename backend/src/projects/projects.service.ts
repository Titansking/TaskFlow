/**
 * Project rules, including what happens to a project's tasks when it is
 * deleted.
 */
import mongoose from 'mongoose';
import { AppError } from '../shared/errors';
import { listOptions, paginate, toRawObject } from '../shared/http';
import type { PageDto, ProjectDto } from '../shared/types';
import { ActivityModel } from '../activities/activities.model';
import { TaskModel } from '../tasks/tasks.model';
import { ProjectModel, type Project } from './projects.model';
import type { CreateProjectBody } from './projects.schema';
import type { PaginationQuery } from '../users/users.schema';

/** Mongo document -> JSON: ids become strings, ObjectIds stay readable. */
const toDto = (doc: object): ProjectDto => {
  const raw = toRawObject(doc);

  return {
    _id: String(raw._id),
    name: raw.name as string,
    color: raw.color as string,
    members: ((raw.members ?? []) as unknown[]).map(String),
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
};

export const listProjects = async (query: PaginationQuery): Promise<PageDto<ProjectDto>> => {
  const page = await paginate<Project>(ProjectModel, {}, listOptions(query));
  return { ...page, items: page.items.map((doc) => toDto(doc as object)) };
};

export const createProject = async (body: CreateProjectBody): Promise<ProjectDto> => {
  const project = await ProjectModel.create({ ...body, members: body.members ?? [] });
  return toDto(project);
};

/**
 * Deletes a project and everything that hangs off it: its tasks and the
 * activity entries that referenced them.
 *
 * When the server supports transactions (Atlas, any replica set) the three
 * deletes run atomically. A standalone development server does not, so we fall
 * back to the same deletes in dependency order.
 */
export const deleteProject = async (id: string): Promise<void> => {
  if (await supportsTransactions()) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => deleteCascade(id, session));
      return;
    } catch (error) {
      // Code 20 = "Transaction numbers are only allowed on a replica set member".
      if (!isUnsupported(error)) throw error;
      console.warn('[mongo] transactions unavailable, deleting without one');
    } finally {
      await session.endSession();
    }
  }

  await deleteCascade(id);
};

const deleteCascade = async (id: string, session?: mongoose.ClientSession): Promise<void> => {
  const useSession = session ?? null;

  const project = await ProjectModel.findByIdAndDelete(id).session(useSession).exec();
  if (!project) throw AppError.notFound('Project not found');

  // Read the task ids *before* deleting, so their activities can be cleaned up.
  const tasks = await TaskModel.find({ projectId: id })
    .select('_id')
    .session(useSession)
    .lean()
    .exec();

  await TaskModel.deleteMany({ projectId: id }).session(useSession).exec();

  if (tasks.length > 0) {
    await ActivityModel.deleteMany({ taskId: { $in: tasks.map((task) => task._id) } })
      .session(useSession)
      .exec();
  }
};

/** Cached after the first attempt — checking costs a round trip. */
let transactionsAvailable: Promise<boolean> | undefined;

const supportsTransactions = (): Promise<boolean> => {
  transactionsAvailable ??=
    mongoose.connection.db
      ?.admin()
      .command({ hello: 1 })
      .then((info) => Boolean(info.setName) || info.msg === 'isdbgrid')
      .catch(() => false) ?? Promise.resolve(false);

  return transactionsAvailable;
};

const isUnsupported = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 20;