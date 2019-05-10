const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 1;

// HTML entities to escape
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ESCAPE_REGEX = /[&<>"'/]/g;

// Basic profanity word list (placeholder - extend as needed)
const PROFANITY_LIST: string[] = [];

const PROFANITY_REGEX = PROFANITY_LIST.length > 0
  ? new RegExp(`\\b(${PROFANITY_LIST.join('|')})\\b`, 'gi')
  : null;

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  return text.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Filter profanity from message content
 */
export function filterProfanity(text: string): string {
  if (!PROFANITY_REGEX) return text;
  return text.replace(PROFANITY_REGEX, (match) => '*'.repeat(match.length));
}

/**
 * Remove excessive whitespace and normalize line breaks
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Full message sanitization pipeline
 */
export function sanitizeMessage(content: string): string {
  let sanitized = content;
  sanitized = normalizeWhitespace(sanitized);
  sanitized = escapeHtml(sanitized);
  sanitized = filterProfanity(sanitized);

  // Truncate if still over limit
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.substring(0, MAX_MESSAGE_LENGTH);
  }

  return sanitized;
}

/**
 * Validate message content before processing
 */
export function isMessageValid(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.length >= MIN_MESSAGE_LENGTH && trimmed.length <= MAX_MESSAGE_LENGTH;
}

/**
 * Sanitize a username
 */
export function sanitizeUsername(username: string): string {
  return escapeHtml(username.trim()).substring(0, 30);
}
