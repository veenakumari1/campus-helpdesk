import { BaseAgent } from './base.agent.js';
import { geminiService } from '../services/gemini.service.js';
import { PrioritySchema } from '../schemas/agentSchemas.js';

export class PriorityAgent extends BaseAgent {
  constructor() {
    super('Priority Agent', 'Determines Low, Medium, High, or Critical urgency with explicit reasoning.');
  }

  async run({ text, location = '', category = '' }) {
    const sanitized = this.sanitizeInput(text);

    const systemPrompt = `You are the University Helpdesk Priority Agent.
Evaluate the urgency of student issues.
Classify priority into:
- "Critical": Active flooding/electrical hazards, active campus-wide outages, exam taking place right now, security breaches.
- "High": Imminent homework/registration deadlines (today/tomorrow), recurring connectivity drops preventing coursework, locked accounts during enrollment.
- "Medium": Non-urgent classroom equipment issues, scheduled bill questions, minor software bugs.
- "Low": Routine inquiries, cosmetic facilities requests, water fountain leaks without flooding, general questions.

Map "Critical" and "High" to uiPriority "High", "Medium" to uiPriority "Normal", and "Low" to uiPriority "Low".
Calculate urgencyScore (1-10) and evaluate isDeadlineImpacting. Provide a concise, clear reason.
Output strictly conforming JSON according to the schema.`;

    const userPrompt = `Issue: "${sanitized}"
Location: "${location}"
Category Context: "${category}"`;

    if (geminiService.isKeyConfigured()) {
      const response = await geminiService.generateStructuredJSON({
        systemInstruction: systemPrompt,
        prompt: userPrompt,
        schema: PrioritySchema
      });

      if (response.success && response.data) {
        return {
          agent: this.name,
          status: 'Completed',
          mode: 'gemini_api',
          result: response.data
        };
      }
    }

    return {
      agent: this.name,
      status: 'Completed',
      mode: 'verified_rules',
      result: this._priorityFallback(sanitized, location)
    };
  }

  _priorityFallback(text, location) {
    const t = text.toLowerCase();
    const loc = (location || '').toLowerCase();

    // Critical conditions
    if (
      t.includes('emergency') ||
      t.includes('fire') ||
      t.includes('flood') ||
      t.includes('hazard') ||
      t.includes('spark') ||
      (t.includes('exam') && (t.includes('now') || t.includes('started')))
    ) {
      return {
        priority: 'Critical',
        uiPriority: 'High',
        urgencyScore: 10,
        isDeadlineImpacting: true,
        reason: 'Immediate safety hazard or critical active exam interruption requiring rapid intervention.'
      };
    }

    // High conditions
    if (
      t.includes('urgent') ||
      t.includes('deadline') ||
      t.includes('cannot access') ||
      t.includes('locked') ||
      t.includes('exam') ||
      t.includes('midterm') ||
      t.includes('due today') ||
      t.includes('disconnecting') ||
      t.includes('drops') ||
      loc.includes('lecture hall')
    ) {
      return {
        priority: 'High',
        uiPriority: 'High',
        urgencyScore: 8,
        isDeadlineImpacting: true,
        reason: 'Significant impact on student coursework, active lecture delivery, or imminent academic deadlines.'
      };
    }

    // Low conditions
    if (
      t.includes('fountain') ||
      t.includes('suggestion') ||
      t.includes('cosmetic') ||
      t.includes('feedback') ||
      t.includes('question')
    ) {
      return {
        priority: 'Low',
        uiPriority: 'Low',
        urgencyScore: 3,
        isDeadlineImpacting: false,
        reason: 'Standard maintenance or non-urgent general inquiry without immediate academic disruption.'
      };
    }

    // Medium / Normal default
    return {
      priority: 'Medium',
      uiPriority: 'Normal',
      urgencyScore: 5,
      isDeadlineImpacting: false,
      reason: 'Standard operational request to be addressed within normal campus business hours.'
    };
  }
}

export const priorityAgent = new PriorityAgent();

