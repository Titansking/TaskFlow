/**
 * Request validation.
 *
 * `check(schema)` runs a Zod schema against one part of the request and
 * replaces it with the parsed result. Because Zod also *coerces*
 * (`"2026-01-15"` becomes a `Date`), handlers always receive correctly typed,
 * already-trimmed data — and invalid input is rejected here, before any
 * database work happens.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny, ZodError } from 'zod';
import { AppError } from './errors';

type Part = 'body' | 'query' | 'params';

const describeIssues = (error: ZodError): string =>
  error.issues
    .map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`)
    .join(', ');

export const check =
  (schema: ZodTypeAny, part: Part = 'body'): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      // Imported lazily would be worse; send the 400 directly here.
      res.status(400).json({
        status: 400,
        success: false,
        message: describeIssues(result.error),
      });
      return;
    }

    if (part === 'query') {
      // `req.query` is a getter-only property, so it has to be redefined.
      Object.defineProperty(req, 'query', { value: result.data, writable: true });
    } else {
      req[part] = result.data;
    }

    next();
  };

/**
 * Rejects a malformed `:id` before it reaches Mongoose, where it would
 * surface as a confusing 500 instead of a clean 400.
 */
export const checkId =
  (param = 'id'): RequestHandler =>
  (req, _res, next): void => {
    if (!/^[a-fA-F0-9]{24}$/.test(req.params[param] ?? '')) {
      next(AppError.badRequest(`'${param}' is not a valid id`));
      return;
    }
    next();
  };