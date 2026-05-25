import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

/**
 * Build an Express middleware that validates a single request slice
 * (`body`, `query`, or `params`) against a zod schema, replacing the slice
 * with the parsed value so handlers consume strictly typed data.
 *
 * Validation failures bubble as ZodError; the central error middleware
 * formats them as 400 responses.
 */
export function validate<T>(
  source: "body" | "query" | "params",
  schema: ZodSchema<T>
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[source]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = parsed;
    next();
  };
}
