import type { Server as HttpServer } from "node:http";
import { Server as IoServer } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { QuestionPaper } from "../llm/types.js";

interface SocketAssignment {
  _id: string;
  title: string;
  status: string;
  draft: unknown;
  paper?: QuestionPaper;
  variantPaper?: QuestionPaper;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
  currentVersion?: number;
  paperVersions?: unknown[];
}

/**
 * Real-time event payloads emitted by the workers and consumed by the
 * frontend output page.
 */
export type ServerEvent =
  | { type: "assignment.queued"; id: string; jobId: string }
  | { type: "assignment.progress"; id: string; percent: number; stage: string }
  | { type: "assignment.ready"; id: string; paper: QuestionPaper; variantPaper?: QuestionPaper; assignment: SocketAssignment }
  | { type: "assignment.updated"; assignment: SocketAssignment }
  | { type: "assignment.failed"; id: string; error: string }
  | { type: "pdf.queued"; id: string }
  | { type: "pdf.ready"; id: string; url: string }
  | { type: "pdf.failed"; id: string; error: string };

let io: IoServer | null = null;

/**
 * Attach socket.io to the existing HTTP server. Each client joins a room
 * scoped to a single assignment so we only flood the right tab with updates.
 */
export function initSockets(server: HttpServer): IoServer {
  io = new IoServer(server, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    logger.debug({ id: socket.id }, "ws connected");

    socket.on("subscribe", (assignmentId: string) => {
      if (typeof assignmentId !== "string" || assignmentId.length === 0) return;
      socket.join(roomFor(assignmentId));
      logger.debug({ id: socket.id, assignmentId }, "ws subscribed");
    });

    socket.on("unsubscribe", (assignmentId: string) => {
      socket.leave(roomFor(assignmentId));
    });

    socket.on("disconnect", () => logger.debug({ id: socket.id }, "ws disconnected"));
  });

  return io;
}

export function roomFor(assignmentId: string): string {
  return `assignment:${assignmentId}`;
}

/** Emit a typed event to every subscriber of the given assignment. */
export function emitToAssignment(assignmentId: string, event: ServerEvent): void {
  if (!io) return;
  io.to(roomFor(assignmentId)).emit(event.type, event);
}

export function getIo(): IoServer | null {
  return io;
}
