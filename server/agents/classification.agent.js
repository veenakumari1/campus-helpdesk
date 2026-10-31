import { BaseAgent } from './base.agent.js';
import { geminiService } from '../services/gemini.service.js';
import { ClassificationSchema } from '../schemas/agentSchemas.js';

export class ClassificationAgent extends BaseAgent {
  constructor() {
    super('Classification Agent', 'Classifies complaint category into Technical, Academic, Finance, or Administrative.');
  }

  async run({ text, location = '' }) {
    const sanitized = this.sanitizeInput(text);
    const injectionCheck = this.detectInjection(sanitized);

    const systemPrompt = `You are the University Helpdesk Classification Agent.
Your responsibility:
Analyze the student's issue and classify it into one of four primary university categories:
1. "Technical" (Wi-Fi, computer labs, projectors, AV systems, portal login, password reset, MFA)
2. "Academic" (course registration, prerequisites, grade appeals, advising, degree audit)
3. "Finance" (tuition, fees, billing statements, financial aid, scholarships, payment holds)
4. "Administrative" (facilities, physical campus maintenance, leaks, heating, ID cards, parking)

Also map it to the helpdesk UI category: "IT & Wi-Fi", "Classrooms", "Facilities", "Accounts", or "Other".
Always output strictly conforming JSON matching the provided schema.`;

    const userPrompt = `Student Problem Description: "${sanitized}"
Location (if provided): "${location}"`;

    if (geminiService.isKeyConfigured()) {
      const response = await geminiService.generateStructuredJSON({
        systemInstruction: systemPrompt,
        prompt: userPrompt,
        schema: ClassificationSchema
      });

      if (response.success && response.data) {
        return {
          agent: this.name,
          status: 'Completed',
          mode: 'gemini_api',
          result: response.data,
          injectionWarning: injectionCheck.detected
        };
      }
    }

    // Verified rule-based classification fallback
    return {
      agent: this.name,
      status: 'Completed',
      mode: 'verified_rules',
      result: this._classifyFallback(sanitized, location),
      injectionWarning: injectionCheck.detected
    };
  }

  _classifyFallback(text, location) {
    const t = text.toLowerCase();
    const loc = (location || '').toLowerCase();

    // 1. Facilities & Physical Plant (Leaks, plumbing, HVAC, power)
    if (t.includes('leak') || t.includes('water') || t.includes('fountain') || t.includes('toilet') || t.includes('hvac') || t.includes('plumbing') || t.includes('heating') || t.includes('door lock') || t.includes('broken desk')) {
      return {
        primaryCategory: 'Administrative',
        subCategory: 'Physical Plant & Maintenance',
        uiCategory: 'Facilities',
        confidence: 0.96,
        detectedEntities: ['facilities', 'maintenance', 'repairs']
      };
    }

    // 2. Finance (Tuition, fees, bursar, billing, financial aid)
    if (t.includes('tuition') || t.includes('bursar') || t.includes('financial aid') || t.includes('late fee') || t.includes('scholarship') || t.includes('billing statement') || t.includes('payment hold') || t.includes('invoice')) {
      return {
        primaryCategory: 'Finance',
        subCategory: 'Tuition & Billing',
        uiCategory: 'Other',
        confidence: 0.95,
        detectedEntities: ['billing', 'tuition', 'finance']
      };
    }

    // 3. Academic (Course registration, prerequisites, advising, grades)
    if (t.includes('prerequisite') || t.includes('course registration') || t.includes('academic advisor') || t.includes('grade appeal') || t.includes('add/drop') || t.includes('degree audit')) {
      return {
        primaryCategory: 'Academic',
        subCategory: 'Registration & Advising',
        uiCategory: 'Other',
        confidence: 0.94,
        detectedEntities: ['academics', 'registration', 'advisor']
      };
    }

    // 4. Wi-Fi & Network
    if (t.includes('wifi') || t.includes('wi-fi') || t.includes('internet') || t.includes('disconnect') || t.includes('network drops') || t.includes('ethernet')) {
      return {
        primaryCategory: 'Technical',
        subCategory: 'Network & Wi-Fi Connectivity',
        uiCategory: 'IT & Wi-Fi',
        confidence: 0.97,
        detectedEntities: ['wifi', 'network', 'connection']
      };
    }

    // 5. Classroom AV & Media (Projectors, lecterns, smartboards)
    if (t.includes('projector') || t.includes('lectern') || t.includes('smartboard') || t.includes('hdmi') || t.includes('audio jack') || (t.includes('screen') && !t.includes('login screen')) || loc.includes('lecture hall')) {
      return {
        primaryCategory: 'Technical',
        subCategory: 'Classroom AV & Instructional Media',
        uiCategory: 'Classrooms',
        confidence: 0.95,
        detectedEntities: ['projector', 'classroom', 'audio-visual']
      };
    }

    // 6. Identity & Accounts (Portal, password, SSO, Duo MFA)
    if (t.includes('portal') || t.includes('password') || t.includes('login') || t.includes('credentials') || t.includes('mfa') || t.includes('duo') || t.includes('locked out') || t.includes('account locked')) {
      return {
        primaryCategory: 'Technical',
        subCategory: 'Identity & Access Management',
        uiCategory: 'Accounts',
        confidence: 0.96,
        detectedEntities: ['portal', 'login', 'account']
      };
    }

    return {
      primaryCategory: 'Administrative',
      subCategory: 'General Inquiry',
      uiCategory: 'Other',
      confidence: 0.75,
      detectedEntities: ['general']
    };
  }
}

export const classificationAgent = new ClassificationAgent();
