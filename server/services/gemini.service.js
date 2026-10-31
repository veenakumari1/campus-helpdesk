import dotenv from 'dotenv';
dotenv.config();

/**
 * Service to interface with Google Gemini API (Free tier compatible).
 * Handles structured JSON generation, rate-limiting, retries, and quota management.
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.requestLog = [];
    this.maxRpm = 15; // Free tier standard RPM is 15 requests/min
  }

  isKeyConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  /**
   * Simple sliding-window rate limiter for free tier quota management.
   */
  _checkQuota() {
    const now = Date.now();
    this.requestLog = this.requestLog.filter((ts) => now - ts < 60000);
    if (this.requestLog.length >= this.maxRpm) {
      const waitTime = Math.ceil((60000 - (now - this.requestLog[0])) / 1000);
      throw new Error(`Gemini Free Tier rate limit reached (${this.maxRpm} RPM). Please wait ${waitTime}s.`);
    }
    this.requestLog.push(now);
  }

  /**
   * Execute a structured JSON generation call to Gemini with backoff.
   */
  async generateStructuredJSON({ systemInstruction, prompt, schema, retries = 2 }) {
    if (!this.isKeyConfigured()) {
      return {
        success: false,
        source: 'unconfigured_key',
        error: 'GEMINI_API_KEY is not configured in backend .env'
      };
    }

    this._checkQuota();

    const endpoint = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // low temperature for deterministic, factual structured data
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        role: 'system',
        parts: [{ text: systemInstruction }]
      };
    }

    if (schema) {
      payload.generationConfig.responseSchema = schema;
    }

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.status === 429) {
          // Quota exhausted / rate limit
          const delay = Math.pow(2, attempt + 1) * 1000;
          if (attempt < retries) {
            await new Promise((r) => setTimeout(r, delay));
            attempt++;
            continue;
          }
          throw new Error('Gemini API quota exceeded (HTTP 429).');
        }

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Gemini API error [HTTP ${response.status}]: ${errBody.slice(0, 200)}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text;

        if (!rawText) {
          throw new Error('No candidate content returned by Gemini API');
        }

        const parsed = JSON.parse(rawText);
        return {
          success: true,
          source: 'gemini_api',
          model: this.modelName,
          data: parsed
        };
      } catch (err) {
        if (attempt >= retries) {
          return {
            success: false,
            source: 'gemini_api_error',
            error: err.message
          };
        }
        attempt++;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
}

export const geminiService = new GeminiService();

