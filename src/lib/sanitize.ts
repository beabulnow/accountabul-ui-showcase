import { z } from "zod";

/** Characters that only ever show up in markup or injection attempts. */
const UNSAFE_PATTERN = /[<>]|&#|javascript:|data:text\/html|on\w+\s*=/i;

/**
 * Strips control characters, zero-width joiners and collapses whitespace.
 * Everything a user types goes through this before it reaches the database.
 */
export function sanitizeText(value: string) {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Same as sanitizeText but keeps intentional line breaks (notes, bios). */
export function sanitizeMultiline(value: string) {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function containsUnsafeMarkup(value: string) {
  return UNSAFE_PATTERN.test(value);
}

/** Single-line free text: sanitized, length-capped and markup-free. */
export function safeText(max: number, message = "Remove any code or special markup") {
  return z
    .string()
    .max(max * 2)
    .transform(sanitizeText)
    .refine((value) => !containsUnsafeMarkup(value), { message })
    .refine((value) => value.length <= max, { message: `Use ${max} characters or fewer` });
}

/** Multi-line free text: keeps line breaks, still markup-free. */
export function safeMultiline(max: number, message = "Remove any code or special markup") {
  return z
    .string()
    .max(max * 2)
    .transform(sanitizeMultiline)
    .refine((value) => !containsUnsafeMarkup(value), { message })
    .refine((value) => value.length <= max, { message: `Use ${max} characters or fewer` });
}
