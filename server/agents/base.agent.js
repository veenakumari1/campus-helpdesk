/**
 * Base Agent with safety sanitization and prompt injection defenses.
 */
export class BaseAgent {
  constructor(name, role) {
    this.name = name;
    this.role = role;
  }

  /**
   * Sanitize student input against prompt injection attempts.
   */
  sanitizeInput(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .trim()
      .split('')
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        return !(code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31));
      })
      .join('')
      .slice(0, 1500); // enforce length limit
  }

  /**
   * Check for blatant adversarial prompt injection patterns.
   */
  detectInjection(text) {
    const lower = text.toLowerCase();
    const suspiciousPatterns = [
      'ignore previous instructions',
      'ignore all prior instructions',
      'system override',
      'you are now in developer mode',
      'dan mode',
      'disregard safety guidelines',
      'bypass authorization',
      'drop table',
      'delete from complaints',
      '<script>'
    ];
    for (const pattern of suspiciousPatterns) {
      if (lower.includes(pattern)) {
        return { detected: true, pattern };
      }
    }
    return { detected: false };
  }
}
