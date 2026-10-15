/**
 * The one error type the app throws.
 *
 * A service says what went wrong (`AppError.notFound('Task not found')`) and
 * the error middleware in `shared/http.ts` turns it into a response. That is
 * why no route or service needs a try/catch just to pick a status code.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 — the request itself is wrong. */
  static badRequest(message = 'Bad request'): AppError {
    return new AppError(message, 400);
  }

  /** 401 — no valid token. */
  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401);
  }

  /** 403 — valid token, but not allowed. */
  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(message, 403);
  }

  /** 404 — the record does not exist. */
  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404);
  }

  /** 409 — it already exists (e.g. duplicate email). */
  static conflict(message = 'Resource already exists'): AppError {
    return new AppError(message, 409);
  }
}