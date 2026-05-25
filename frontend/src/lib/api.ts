import { API_BASE_URL } from "@/lib/env";
import {
  mapApiAssignment,
  toApiQuestionTypes,
  type ApiAssignment,
} from "@/lib/map-assignment";
import type { Assignment, AssignmentDraft, QuestionPaper } from "@/types/assignment";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("Invalid JSON response from server", res.status);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const body = await parseJson<{ message?: string; code?: string }>(res);
      message = body.message ?? message;
      code = body.code;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(
      message || `Request failed (${res.status})`,
      res.status,
      code
    );
  }

  if (res.status === 204) return undefined as T;
  return parseJson<T>(res);
}

export interface CreateAssignmentPayload {
  draft: AssignmentDraft;
  file?: File | null;
  title?: string;
  schoolName?: string;
  subject?: string;
  className?: string;
}

export const api = {
  async listAssignments(): Promise<Assignment[]> {
    const data = await request<{ items: ApiAssignment[] }>("/api/assignments");
    return data.items.map(mapApiAssignment);
  },

  async getAssignment(id: string): Promise<Assignment> {
    const doc = await request<ApiAssignment>(`/api/assignments/${id}`);
    return mapApiAssignment(doc);
  },

  async createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
    const { draft, file } = payload;
    const form = new FormData();
    form.append("title", payload.title ?? draft.title ?? "Generated Question Paper");
    form.append("dueDate", draft.dueDate);
    form.append(
      "questionTypes",
      JSON.stringify(toApiQuestionTypes(draft.questionTypes))
    );
    form.append("additionalInstructions", draft.additionalInstructions);
    form.append(
      "schoolName",
      payload.schoolName ?? draft.schoolName ?? "Delhi Public School, Sector-4, Bokaro"
    );
    form.append("subject", payload.subject ?? draft.subject ?? "General Studies");
    form.append("className", payload.className ?? draft.className ?? "5th");
    if (file) form.append("file", file);

    const doc = await request<ApiAssignment>("/api/assignments", {
      method: "POST",
      body: form,
    });
    return mapApiAssignment(doc);
  },

  async deleteAssignment(id: string): Promise<void> {
    await request<void>(`/api/assignments/${id}`, { method: "DELETE" });
  },

  async updateAssignment(
    id: string,
    payload: { title?: string; paper?: QuestionPaper; note?: string }
  ): Promise<Assignment> {
    const doc = await request<ApiAssignment>(`/api/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return mapApiAssignment(doc);
  },

  async regenerateAssignment(id: string, instructions?: string): Promise<Assignment> {
    const doc = await request<ApiAssignment>(`/api/assignments/${id}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructions }),
    });
    return mapApiAssignment(doc);
  },

  /**
   * Download PDF blob. Returns null when the server accepted a background job (202).
   */
  async downloadPdf(id: string): Promise<Blob | null> {
    const res = await fetch(`${API_BASE_URL}/api/assignments/${id}/pdf`, {
      credentials: "include",
    });

    if (res.status === 202) return null;

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        (body as { message?: string }).message ?? "PDF download failed",
        res.status
      );
    }

    return res.blob();
  },
};
