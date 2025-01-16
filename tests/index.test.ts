import { describe, it, expect, beforeEach } from 'vitest';
import {
  escapeHtml,
  filterProfanity,
  normalizeWhitespace,
  sanitizeMessage,
  isMessageValid,
  sanitizeUsername,
} from '../src/utils/sanitize';

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it('escapes forward slashes', () => {
    expect(escapeHtml('a/b')).toBe('a&#x2F;b');
  });

  it('handles strings without special characters', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes multiple special characters', () => {
    expect(escapeHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
  });
});

describe('normalizeWhitespace', () => {
  it('converts \\r\\n to \\n', () => {
    expect(normalizeWhitespace('a\r\nb')).toBe('a\nb');
  });

  it('collapses excessive newlines to double newline', () => {
    expect(normalizeWhitespace('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('collapses multiple spaces to single space', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('collapses tabs', () => {
    expect(normalizeWhitespace('hello\t\tworld')).toBe('hello world');
  });
});

describe('sanitizeMessage', () => {
  it('normalizes whitespace', () => {
    const result = sanitizeMessage('  hello    world  ');
    expect(result).toBe('hello world');
  });

  it('escapes HTML characters', () => {
    const result = sanitizeMessage('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('truncates messages exceeding max length', () => {
    const longMessage = 'a'.repeat(3000);
    const result = sanitizeMessage(longMessage);
    expect(result.length).toBeLessThanOrEqual(2000);
  });
});

describe('isMessageValid', () => {
  it('validates a normal message', () => {
    expect(isMessageValid('Hello!')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isMessageValid('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(isMessageValid('   ')).toBe(false);
  });

  it('rejects null/undefined', () => {
    expect(isMessageValid(null as any)).toBe(false);
    expect(isMessageValid(undefined as any)).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isMessageValid(123 as any)).toBe(false);
  });

  it('rejects messages exceeding max length', () => {
    const longMessage = 'a'.repeat(2001);
    expect(isMessageValid(longMessage)).toBe(false);
  });

  it('accepts messages at max length', () => {
    const maxMessage = 'a'.repeat(2000);
    expect(isMessageValid(maxMessage)).toBe(true);
  });
});

describe('sanitizeUsername', () => {
  it('escapes HTML in usernames', () => {
    expect(sanitizeUsername('<script>evil</script>')).toContain('&lt;');
  });

  it('trims whitespace', () => {
    expect(sanitizeUsername('  alice  ')).toBe('alice');
  });

  it('truncates long usernames to 30 characters', () => {
    const longName = 'a'.repeat(50);
    const result = sanitizeUsername(longName);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});
