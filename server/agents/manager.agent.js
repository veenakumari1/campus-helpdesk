import { BaseAgent } from './base.agent.js';
import { classificationAgent } from './classification.agent.js';
import { priorityAgent } from './priority.agent.js';
import { resolutionAgent } from './resolution.agent.js';
import { routingAgent } from './routing.agent.js';
import { validationAgent } from './validation.agent.js';
import { auditService } from '../services/audit.service.js';

export class ManagerAgent extends BaseAgent {
  constructor() {
    super('Manager / Orchestrator Agent', 'Coordinates multi-agent planning, parallel specialist delegation, and output synthesis.');
    this.activeWorkflows = new Map();
  }

  /**
   * Orchestrate the multi-agent workflow for a student request.
   */
  async processRequest({ text, location = '', student = { id: 'student-101', name: 'Veena Chen', email: 'v.chen@campus.edu' } }) {
    const analysisId = `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();

    // Staged real-time activity tracker
    const timeline = [];
    const recordStep = (agentName, status, details) => {
      const step = {
        timestamp: new Date().toISOString(),
        agent: agentName,
        status,
        details
      };
      timeline.push(step);
      return step;
    };

    recordStep(this.name, 'Planning', 'Received student request. Constructing task plan and security boundaries.');

    // Step 1: Input sanitization & plan formulation
    const sanitized = this.sanitizeInput(text);
    const plan = {
      stages: [
        { stage: 1, name: 'Triage & Planning', agents: ['Manager Agent'] },
        { stage: 2, name: 'Parallel Specialist Analysis', agents: ['Classification Agent', 'Priority Agent', 'Resolution Agent', 'Routing Agent'] },
        { stage: 3, name: 'Quality & Safety Verification', agents: ['Validation Agent'] },
        { stage: 4, name: 'Synthesis & Student Confirmation Prep', agents: ['Manager Agent'] }
      ]
    };

    recordStep(this.name, 'Delegating', 'Spawning Classification, Priority, Resolution, and Routing agents in parallel.');

    // Step 2: Parallel execution of independent specialist agents
    const [classificationOutput, priorityOutput, resolutionOutput, routingOutput] = await Promise.all([
      classificationAgent.run({ text: sanitized, location }),
      priorityAgent.run({ text: sanitized, location }),
      resolutionAgent.run({ text: sanitized }),
      routingAgent.run({ text: sanitized })
    ]);

    recordStep(classificationAgent.name, classificationOutput.status, `Category: ${classificationOutput.result.primaryCategory} (${classificationOutput.result.uiCategory})`);
    recordStep(priorityAgent.name, priorityOutput.status, `Priority: ${priorityOutput.result.priority} - ${priorityOutput.result.reason}`);
    recordStep(resolutionAgent.name, resolutionOutput.status, `Self-resolvable: ${resolutionOutput.result.canSelfResolve}. Found ${resolutionOutput.result.steps.length} steps.`);
    recordStep(routingAgent.name, routingOutput.status, `Routed to: ${routingOutput.result.departmentName} (${routingOutput.result.supportTeam})`);

    // Step 3: Run Validation Agent to audit cross-agent consistency & safety
    recordStep(validationAgent.name, 'Auditing', 'Auditing findings for policy consistency and prompt safety.');
    const validationOutput = await validationAgent.run({
      studentInput: sanitized,
      classification: classificationOutput.result,
      priority: priorityOutput.result,
      resolution: resolutionOutput.result,
      routing: routingOutput.result
    });
    recordStep(validationAgent.name, validationOutput.status, validationOutput.result.validationNotes);

    // Step 4: Manager Agent synthesizes final recommendation and prepares draft complaint
    recordStep(this.name, 'Synthesizing', 'Combining all specialist findings into a cohesive student advisory.');

    // Derive suggested complaint payload for the student confirmation gate
    const suggestedTitle = sanitized.length > 60
      ? sanitized.slice(0, 57).trim() + '...'
      : sanitized;

    const suggestedComplaint = {
      title: suggestedTitle,
      description: sanitized,
      category: classificationOutput.result.uiCategory,
      priority: priorityOutput.result.uiPriority,
      department: routingOutput.result.departmentName,
      location: (location || 'Campus').trim(),
      reporter: student.name,
      reporterEmail: student.email,
      studentId: student.id,
      analysisId
    };

    const executionTimeMs = Date.now() - startTime;
    recordStep(this.name, 'Completed', `Workflow completed in ${executionTimeMs}ms. Ready for student confirmation.`);

    const workflowResult = {
      analysisId,
      timestamp: new Date().toISOString(),
      student,
      plan,
      timeline,
      executionTimeMs,
      specialistOutputs: {
        classification: classificationOutput,
        priority: priorityOutput,
        resolution: resolutionOutput,
        routing: routingOutput,
        validation: validationOutput
      },
      synthesis: {
        summary: `Issue analyzed as ${classificationOutput.result.primaryCategory} concern (${classificationOutput.result.subCategory}) with ${priorityOutput.result.priority} priority.`,
        urgencySummary: priorityOutput.result.reason,
        troubleshooting: resolutionOutput.result.steps,
        policyCitation: resolutionOutput.result.policyReference,
        departmentRouting: `${routingOutput.result.departmentName} (${routingOutput.result.supportTeam})`,
        contactEmail: routingOutput.result.contactEmail,
        estimatedSLA: routingOutput.result.estimatedSLA,
        canSelfResolve: resolutionOutput.result.canSelfResolve,
        warnings: resolutionOutput.result.warnings,
        safetyAudit: validationOutput.result.safetyAudit,
        isValid: validationOutput.result.isValid
      },
      suggestedComplaint,
      requiresStudentConfirmation: true
    };

    // Save to active workflows cache and audit log
    this.activeWorkflows.set(analysisId, workflowResult);

    auditService.log({
      type: 'WORKFLOW_EXECUTED',
      studentId: student.id,
      details: {
        analysisId,
        category: classificationOutput.result.primaryCategory,
        priority: priorityOutput.result.priority,
        department: routingOutput.result.departmentName,
        executionTimeMs
      },
      status: 'SUCCESS'
    });

    return workflowResult;
  }

  getWorkflow(analysisId) {
    return this.activeWorkflows.get(analysisId) || null;
  }

  getAllWorkflows() {
    return Array.from(this.activeWorkflows.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }
}

export const managerAgent = new ManagerAgent();

