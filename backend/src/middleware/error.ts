import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

/**
 * Domain-level error with a stable HTTP status + machine code.
 * Throw these from services/routes; the central handler maps them to JSON.
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const NotFound = (resource: string, id?: string) =>
  new HttpError(404, "not_found", `${resource}${id ? ` ${id}` : ""} not found`);
export const BadRequest = (message: string, details?: unknown) =>
  new HttpError(400, "bad_request", message, details);

/** Catches anything thrown in async handlers without per-route try/catch. */
export const asyncHandler =
  <P, R, B, Q>(
    fn: (
      req: Request<P, R, B, Q>,
      res: Response<R>,
      next: NextFunction
    ) => Promise<unknown>
  ) =>
  (req: Request<P, R, B, Q>, res: Response<R>, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Express expects exactly four parameters on the error handler signature.
 * `next` is referenced via destructuring so eslint doesn't flag it as unused.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 400,
      code: "validation_error",
      message: "Request validation failed",
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof HttpError) {
    if (err.status >= 500) {
      logger.error({ err, path: req.path }, err.message);
    } else {
      logger.warn({ status: err.status, code: err.code, path: req.path }, err.message);
    }
    res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  logger.error({ err, path: req.path }, "unhandled error");
  res.status(500).json({
    status: 500,
    code: "internal_error",
    message: "Internal server error",
  });
};
