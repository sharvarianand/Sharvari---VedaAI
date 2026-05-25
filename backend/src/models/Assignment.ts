import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

/**
 * Mongoose persistence for assignments.
 *
 * The `paper` subdocument is intentionally schema-less from mongoose's POV:
 * it's validated by the same zod schema the LLM adapters return, so we keep
 * a single source of truth in `llm/types.ts` and avoid double maintenance.
 */

const QuestionTypeConfigSchema = new Schema(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true },
    marksPerQuestion: { type: Number, required: true },
  },
  { _id: false }
);

const MaterialSchema = new Schema(
  {
    name: String,
    size: Number,
    mime: String,
    storedPath: String,
    extractedText: String,
  },
  { _id: false }
);

const DraftSchema = new Schema(
  {
    material: { type: MaterialSchema, default: undefined },
    dueDate: { type: String, required: true },
    questionTypes: { type: [QuestionTypeConfigSchema], default: [] },
    additionalInstructions: { type: String, default: "" },
    regenerationInstructions: { type: String, default: "" },
    schoolName: { type: String, default: "Delhi Public School, Sector-4, Bokaro" },
    subject: { type: String, default: "General Studies" },
    className: { type: String, default: "5th" },
    language: { type: String, enum: ["english", "hindi", "bilingual"], default: "english" },
    generateVariants: { type: Boolean, default: false },
  },
  { _id: false }
);

const PaperVersionSchema = new Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true },
    source: { type: String, enum: ["ai", "manual"], required: true },
    note: { type: String, default: "" },
    paper: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AssignmentSchema = new Schema(
  {
    _id: { type: String, required: true },
    teacherId: { type: String, default: "demo-teacher", index: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "queued", "generating", "ready", "failed"],
      default: "draft",
      index: true,
    },
    draft: { type: DraftSchema, required: true },
    paper: { type: Schema.Types.Mixed },
    /** Set B variant paper for A/B exam sets. */
    variantPaper: { type: Schema.Types.Mixed },
    currentVersion: { type: Number, default: 0 },
    paperVersions: { type: [PaperVersionSchema], default: [] },
    pdfPath: { type: String },
    pdfStatus: {
      type: String,
      enum: ["idle", "queued", "generating", "ready", "failed"],
      default: "idle",
    },
    jobId: { type: String },
    error: { type: String },
  },
  { timestamps: true, _id: false }
);

AssignmentSchema.index({ createdAt: -1 });

export type AssignmentDoc = HydratedDocument<InferSchemaType<typeof AssignmentSchema>>;
export const AssignmentModel = model("Assignment", AssignmentSchema);
