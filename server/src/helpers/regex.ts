/** Escape a user-supplied string so it is treated as a literal inside a RegExp. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive "contains" RegExp from untrusted input.
 * Escapes regex metacharacters (prevents injection) and caps length
 * (prevents catastrophic-backtracking / ReDoS on huge inputs).
 */
export function safeSearchRegex(input: string): RegExp {
  return new RegExp(escapeRegex(String(input).slice(0, 200)), "i");
}
