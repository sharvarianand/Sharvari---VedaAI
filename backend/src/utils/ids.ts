import { customAlphabet } from "nanoid";

/**
 * Public assignment ids: 12-char URL-safe alphabet. Long enough to avoid
 * collisions in any realistic dataset, short enough to fit comfortably in
 * URLs and logs.
 */
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
export const newAssignmentId = customAlphabet(alphabet, 12);
