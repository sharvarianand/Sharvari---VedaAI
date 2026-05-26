"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Assignment,
  AssignmentDraft,
  GenerationProgress,
} from "@/types/assignment";

/**
 * Client-side assignments store.
 *
 * Mirrors MongoDB assignments for instant UI updates. WebSocket handlers
 * and API responses both funnel through `upsertAssignment`.
 */

const EMPTY_DRAFT: AssignmentDraft = {
  title: "Generated Question Paper",
  file: null,
  dueDate: "",
  questionTypes: [
    { id: "qt-1", type: "mcq", count: 4, marksPerQuestion: 1 },
    { id: "qt-2", type: "short", count: 3, marksPerQuestion: 2 },
    { id: "qt-3", type: "diagram", count: 5, marksPerQuestion: 5 },
    { id: "qt-4", type: "numerical", count: 5, marksPerQuestion: 5 },
  ],
  additionalInstructions: "",
  language: "english",
};

function buildEmptyDraft(): AssignmentDraft {
  return {
    ...EMPTY_DRAFT,
    questionTypes: EMPTY_DRAFT.questionTypes.map((row) => ({ ...row })),
  };
}

function normalizeDraft(draft: Partial<AssignmentDraft> | undefined): AssignmentDraft {
  return {
    ...buildEmptyDraft(),
    ...draft,
    title: draft?.title ?? EMPTY_DRAFT.title,
    file: draft?.file ?? null,
    dueDate: draft?.dueDate ?? "",
    questionTypes:
      draft?.questionTypes?.map((row) => ({ ...row })) ??
      buildEmptyDraft().questionTypes,
    additionalInstructions: draft?.additionalInstructions ?? "",
  };
}

interface AssignmentsState {
  assignments: Assignment[];
  draft: AssignmentDraft;
  /** Per-assignment generation progress (not persisted). */
  generationProgress: Record<string, GenerationProgress>;

  setDraft: (patch: Partial<AssignmentDraft>) => void;
  resetDraft: () => void;
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  upsertAssignment: (assignment: Assignment) => void;
  setGenerationProgress: (id: string, percent: number, stage: string) => void;
}

export const useAssignmentsStore = create<AssignmentsState>()(
  persist(
    (set) => ({
      assignments: [],
      draft: buildEmptyDraft(),
      generationProgress: {},

      setDraft: (patch) =>
        set((state) => ({ draft: normalizeDraft({ ...state.draft, ...patch }) })),

      resetDraft: () => set({ draft: buildEmptyDraft() }),

      setAssignments: (assignments) => set({ assignments }),

      addAssignment: (assignment) =>
        set((state) => ({ assignments: [assignment, ...state.assignments] })),

      removeAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
        })),

      upsertAssignment: (assignment) =>
        set((state) => {
          const idx = state.assignments.findIndex((a) => a.id === assignment.id);
          if (idx === -1) {
            return { assignments: [assignment, ...state.assignments] };
          }
          const next = [...state.assignments];
          next[idx] = assignment;
          return { assignments: next };
        }),

      setGenerationProgress: (id, percent, stage) =>
        set((state) => ({
          generationProgress: {
            ...state.generationProgress,
            [id]: { percent, stage },
          },
        })),
    }),
    {
      name: "vedaai.assignments",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AssignmentsState> | undefined;
        return {
          assignments: state?.assignments ?? [],
          draft: normalizeDraft(state?.draft),
          generationProgress: {},
        };
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<AssignmentsState> | undefined;
        return {
          ...currentState,
          ...state,
          assignments: state?.assignments ?? currentState.assignments,
          draft: normalizeDraft(state?.draft),
          generationProgress: currentState.generationProgress,
        };
      },
      partialize: (state) => ({
        assignments: state.assignments,
        draft: state.draft,
      }),
    }
  )
);

export { EMPTY_DRAFT };
