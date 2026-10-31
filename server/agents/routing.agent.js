import { BaseAgent } from './base.agent.js';
import { geminiService } from '../services/gemini.service.js';
import { knowledgeService } from '../services/knowledge.service.js';
import { RoutingSchema } from '../schemas/agentSchemas.js';

export class RoutingAgent extends BaseAgent {
  constructor() {
    super('Routing Agent', 'Identifies the correct university department and support team using verified department data.');
  }

  async run({ text, category = '' }) {
    const sanitized = this.sanitizeInput(text);
    const departments = knowledgeService.getAllDepartments();
    const matchedDept = knowledgeService.findDepartment(sanitized, category);

    const systemPrompt = `You are the University Helpdesk Routing Agent.
Identify the exact department and support team that owns this complaint based on the official university department directory.
Assign the departmentId, departmentName, supportTeam, contactEmail, phone, and estimatedSLA.
Output strictly conforming JSON according to the schema.

OFFICIAL UNIVERSITY DEPARTMENTS DIRECTORY:
${JSON.stringify(departments, null, 2)}`;

    const userPrompt = `Student Problem: "${sanitized}"
Category: "${category}"`;

    if (geminiService.isKeyConfigured()) {
      const response = await geminiService.generateStructuredJSON({
        systemInstruction: systemPrompt,
        prompt: userPrompt,
        schema: RoutingSchema
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
      result: {
        departmentId: matchedDept.id,
        departmentName: matchedDept.name,
        supportTeam: matchedDept.supportTeam,
        contactEmail: matchedDept.email,
        phone: matchedDept.phone,
        estimatedSLA: matchedDept.sla
      }
    };
  }
}

export const routingAgent = new RoutingAgent();

