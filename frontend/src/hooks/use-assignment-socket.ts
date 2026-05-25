"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { WS_BASE_URL } from "@/lib/env";
import { mapApiAssignment, type ApiAssignment } from "@/lib/map-assignment";
import { useAssignmentsStore } from "@/store/assignments-store";
import type { QuestionPaper } from "@/types/assignment";

type AssignmentQueued = { type: "assignment.queued"; id: string; jobId: string };
type AssignmentProgress = {
  type: "assignment.progress";
  id: string;
  percent: number;
  stage: string;
};
type AssignmentReady = {
  type: "assignment.ready";
  id: string;
  paper: QuestionPaper;
  assignment: ApiAssignment;
};
type AssignmentUpdated = {
  type: "assignment.updated";
  assignment: ApiAssignment;
};
type AssignmentFailed = {
  type: "assignment.failed";
  id: string;
  error: string;
};
type PdfQueued = { type: "pdf.queued"; id: string };
type PdfReady = { type: "pdf.ready"; id: string; url: string };
type PdfFailed = { type: "pdf.failed"; id: string; error: string };

export interface AssignmentSocketHandlers {
  onPdfReady?: (url: string) => void;
  onPdfFailed?: (error: string) => void;
}

/**
 * Subscribe to real-time assignment events for a single paper.
 * Updates the Zustand store optimistically as workers emit progress.
 */
export function useAssignmentSocket(
  assignmentId: string | undefined,
  handlers?: AssignmentSocketHandlers
) {
  const upsertAssignment = useAssignmentsStore((s) => s.upsertAssignment);
  const setGenerationProgress = useAssignmentsStore((s) => s.setGenerationProgress);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!assignmentId) return;

    const socket = io(WS_BASE_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("subscribe", assignmentId);
    });

    socket.on("assignment.queued", (evt: AssignmentQueued) => {
      if (evt.id !== assignmentId) return;
      const current = useAssignmentsStore.getState().assignments.find(
        (a) => a.id === assignmentId
      );
      if (!current) return;
      upsertAssignment({ ...current, status: "queued", error: undefined });
      setGenerationProgress(assignmentId, 5, "queued");
    });

    socket.on("assignment.progress", (evt: AssignmentProgress) => {
      if (evt.id !== assignmentId) return;
      const current = useAssignmentsStore.getState().assignments.find(
        (a) => a.id === assignmentId
      );
      if (current && current.status !== "generating") {
        upsertAssignment({ ...current, status: "generating" });
      }
      setGenerationProgress(assignmentId, evt.percent, evt.stage);
    });

    socket.on("assignment.ready", (evt: AssignmentReady) => {
      if (evt.id !== assignmentId) return;
      upsertAssignment(mapApiAssignment(evt.assignment));
      setGenerationProgress(assignmentId, 100, "ready");
    });

    socket.on("assignment.updated", (evt: AssignmentUpdated) => {
      if (evt.assignment._id !== assignmentId) return;
      upsertAssignment(mapApiAssignment(evt.assignment));
    });

    socket.on("assignment.failed", (evt: AssignmentFailed) => {
      if (evt.id !== assignmentId) return;
      const current = useAssignmentsStore.getState().assignments.find(
        (a) => a.id === assignmentId
      );
      if (!current) return;
      upsertAssignment({
        ...current,
        status: "failed",
        error: evt.error,
      });
      setGenerationProgress(assignmentId, 0, "failed");
    });

    socket.on("pdf.ready", (evt: PdfReady) => {
      if (evt.id !== assignmentId) return;
      handlersRef.current?.onPdfReady?.(evt.url);
    });

    socket.on("pdf.failed", (evt: PdfFailed) => {
      if (evt.id !== assignmentId) return;
      handlersRef.current?.onPdfFailed?.(evt.error);
    });

    socket.on("pdf.queued", (_evt: PdfQueued) => {
      /* UI can show a spinner via download handler */
    });

    return () => {
      socket.emit("unsubscribe", assignmentId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [assignmentId, upsertAssignment, setGenerationProgress]);
}
