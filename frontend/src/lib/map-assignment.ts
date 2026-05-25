import type {
  Assignment,
  AssignmentDraft,
  PaperVersion,
  AssignmentStatus,
  QuestionPaper,
  QuestionTypeConfig,
} from "@/types/assignment";

/** Raw assignment document returned by the Express API. */
export interface ApiAssignment {
  _id: string;
  title: string;
  status: AssignmentStatus;
  draft: {
    material?: { name?: string; size?: number; mime?: string };
    dueDate: string;
    questionTypes: Array<{
      type: QuestionTypeConfig["type"];
      count: number;
      marksPerQuestion: number;
    }>;
    additionalInstructions?: string;
    regenerationInstructions?: string;
    schoolName?: string;
    subject?: string;
    className?: string;
  };
  paper?: QuestionPaper;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
  currentVersion?: number;
  paperVersions?: Array<{
    version: number;
    title: string;
    source: PaperVersion["source"];
    note?: string;
    paper: QuestionPaper;
    createdAt?: string;
  }>;
}

function mapDraft(api: ApiAssignment): AssignmentDraft {
  return {
    title: api.title,
    file: api.draft.material?.name
      ? {
          name: api.draft.material.name,
          size: api.draft.material.size ?? 0,
          type: api.draft.material.mime ?? "application/octet-stream",
        }
      : null,
    dueDate: api.draft.dueDate,
    questionTypes: api.draft.questionTypes.map((q, i) => ({
      id: `qt-${i}`,
      type: q.type,
      count: q.count,
      marksPerQuestion: q.marksPerQuestion,
    })),
    additionalInstructions: api.draft.additionalInstructions ?? "",
    schoolName: api.draft.schoolName,
    subject: api.draft.subject,
    className: api.draft.className,
  };
}

function mapVersion(version: NonNullable<ApiAssignment["paperVersions"]>[number]): PaperVersion {
  return {
    version: version.version,
    title: version.title,
    source: version.source,
    note: version.note ?? "",
    paper: version.paper,
    createdAt: version.createdAt ?? new Date().toISOString(),
  };
}

/** Normalize an API document into the frontend `Assignment` shape. */
export function mapApiAssignment(doc: ApiAssignment): Assignment {
  const created =
    doc.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  return {
    id: doc._id,
    title: doc.title,
    assignedOn: created,
    dueOn: doc.draft.dueDate,
    status: doc.status,
    draft: mapDraft(doc),
    paper: doc.paper,
    currentVersion: doc.currentVersion ?? 0,
    paperVersions: (doc.paperVersions ?? []).map(mapVersion),
    error: doc.error ?? undefined,
  };
}

/** Strip React-only ids before sending question types to the API. */
export function toApiQuestionTypes(
  rows: QuestionTypeConfig[]
): Array<{ type: string; count: number; marksPerQuestion: number }> {
  return rows.map(({ type, count, marksPerQuestion }) => ({
    type,
    count,
    marksPerQuestion,
  }));
}
