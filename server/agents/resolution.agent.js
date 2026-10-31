import { BaseAgent } from './base.agent.js';
import { geminiService } from '../services/gemini.service.js';
import { knowledgeService } from '../services/knowledge.service.js';
import { ResolutionSchema } from '../schemas/agentSchemas.js';

export class ResolutionAgent extends BaseAgent {
  constructor() {
    super('Resolution Agent', 'Provides verified troubleshooting steps based strictly on official campus policies.');
  }

  async run({ text, category: _category = '' }) {
    const sanitized = this.sanitizeInput(text);
    const relevantFaq = knowledgeService.findRelevantFaq(sanitized);
    const allFaqs = knowledgeService.getAllFaqs();

    const systemPrompt = `You are the University Helpdesk Resolution Agent.
CRITICAL MANDATE:
- Suggest troubleshooting steps based ONLY on verified university policies and FAQs provided below.
- NEVER invent phone numbers, URLs, office rooms, or troubleshooting procedures not explicitly supported.
- If no verified self-help resolution applies, set "canSelfResolve": false and advise submitting a ticket for technician dispatch.
- Output strictly conforming JSON according to the schema.

VERIFIED UNIVERSITY FAQS AND POLICIES DATABASE:
${JSON.stringify(allFaqs, null, 2)}`;

    const userPrompt = `Student Problem: "${sanitized}"
Matched Topic: "${relevantFaq ? relevantFaq.topic : 'None'}"`;

    if (geminiService.isKeyConfigured()) {
      const response = await geminiService.generateStructuredJSON({
        systemInstruction: systemPrompt,
        prompt: userPrompt,
        schema: ResolutionSchema
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

    // Grounded fallback using verified FAQ
    return {
      agent: this.name,
      status: 'Completed',
      mode: 'verified_rules',
      result: this._resolutionFallback(relevantFaq, sanitized)
    };
  }

  _resolutionFallback(faq, _text) {
    if (faq && faq.verifiedSteps && faq.verifiedSteps.length > 0) {
      return {
        canSelfResolve: faq.allowedSelfResolution,
        steps: faq.verifiedSteps,
        policyReference: `${faq.topic} (Policy Ref: ${faq.id})`,
        warnings: faq.allowedSelfResolution
          ? 'If these steps do not restore service, proceed with official ticket confirmation.'
          : 'Do not attempt manual physical repairs on campus infrastructure. Safety hazard.'
      };
    }

    return {
      canSelfResolve: false,
      steps: [
        'Document the exact location, time, and error messages encountered.',
        'Submit the formal helpdesk ticket below for staff dispatch.',
        'An authorized campus technician will be assigned to evaluate the issue.'
      ],
      policyReference: 'Campus General Service Standard Policy 1.1',
      warnings: 'Never attempt unauthorized physical disassembly or configuration modifications.'
    };
  }
}

export const resolutionAgent = new ResolutionAgent();
