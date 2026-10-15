/**
 * HTTP plumbing shared by every route: the response envelope, the async
 * wrapper, and the single error handler that closes the app.
 *
 * The envelope is why the frontend can rely on one contract:
 *   { status, success, message, data }
 */
import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '../config';
import { AppError } from './errors';
import type { PageDto } from './types';

export interface ApiResponse<T = unknown> {
  status: number;
  success: boolean;
  message: string;
  data?: T;
}

export const ok = <T>(data: T, message = 'Success'): ApiResponse<T> => ({
  status: 200,
  success: true,
  message,
  data,
});

export const created = <T>(data: T, message = 'Created successfully'): ApiResponse<T> => ({
  status: 201,
  success: true,
  message,
  data,
});

export const fail = (message: string, status = 500): ApiResponse => ({
  status,
  success: false,
  message,
});

/** Writes an envelope to the response. Routes call this and nothing else. */
export const send = <T>(res: Response, response: ApiResponse<T>): Response =>
  res.status(response.status).json(response);

/**
 * Wraps an async route handler so a rejected promise reaches the error
 * middleware. Without it, Express 4 would let the request hang.
 */
export const asyncRoute =
  (handler: (req: Request, res: Response, next: NextFunctionLike) => Promise<unknown>): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

type NextFunctionLike = Parameters<RequestHandler>[2];

/* ------------------------------ pagination -------------------------------- */

/**
 * Runs a `find` + `countDocuments` as two parallel queries.
 *
 * `lean()` returns plain objects instead of Mongoose documents, which is
 * cheaper for read-only endpoints. `compact()` drops `undefined` keys because
 * MongoDB matches `{ status: undefined }` against *nothing* — an omitted filter
 * would otherwise silently return zero rows.
 */
export const paginate = async <T>(
  model: mongoose.Model<T>,
  filter: Record<string, unknown>,
  { page, limit, skip, sort }: { page: number; limit: number; skip: number; sort: Record<string, 1 | -1> },
): Promise<PageDto<unknown>> => {
  const where = Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined),
  );

  const [items, totalItems] = await Promise.all([
    model.find(where).lean().sort(sort).skip(skip).limit(limit),
    model.countDocuments(where),
  ]);

  return {
    items: items as unknown[],
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      totalItems,
      itemsPerPage: limit,
    },
  };
};

/** Turns the validated `?page=&limit=&sortBy=&sortOrder=` into Mongo options. */
export const listOptions = ({
  page,
  limit,
  sortBy,
  sortOrder,
}: { page: number; limit: number; sortBy: string; sortOrder: 'asc' | 'desc' }) => {
  const direction = sortOrder === 'asc' ? (1 as const) : (-1 as const);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    /*
     * `_id` is a tiebreaker, not decoration.
     *
     * Records created in the same millisecond share a `createdAt`, and MongoDB
     * makes no promise about their relative order. Without a second key, page 1
     * and page 2 can overlap or skip rows entirely — a record can appear on
     * both pages, or on none. `_id` is unique, so adding it makes the ordering
     * total and the page boundaries stable.
     */
    sort: { [sortBy]: direction, _id: direction } as Record<string, 1 | -1>,
  };
};

/* ------------------------------ error handling ---------------------------- */

/** Terminal 404 — mounted after every route. */
export const notFound: RequestHandler = (req, res): void => {
  send(res, fail(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

/** Maps any thrown value onto an HTTP status and a message. */
const describe = (error: unknown): { statusCode: number; message: string } => {
  if (error instanceof AppError) {
    return { statusCode: error.statusCode, message: error.message };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      message: Object.values(error.errors)
        .map((field) => field.message)
        .join(', '),
    };
  }

  if (error instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid value for field '${error.path}'` };
  }

  if (error instanceof mongoose.Error && (error as { code?: number }).code === 11000) {
    return { statusCode: 409, message: 'A record with those unique fields already exists' };
  }

  if (error instanceof Error) {
    // body-parser and other middleware already attach a 4xx status.
    const status = (error as { status?: number; statusCode?: number }).statusCode
      ?? (error as { status?: number }).status;

    if (typeof status === 'number' && status >= 400 && status < 500) {
      return { statusCode: status, message: error.message };
    }

    return {
      statusCode: 500,
      message: env.isProduction ? 'Internal server error' : error.message,
    };
  }

  return { statusCode: 500, message: 'Internal server error' };
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next): void => {
  const { statusCode, message } = describe(error);

  // Only server faults are worth a stack trace; 4xx are the caller's problem.
  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${message}`, error);
  }

  send(res, fail(message, statusCode));
};