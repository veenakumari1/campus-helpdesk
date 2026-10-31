import express from 'express';
import { managerAgent } from '../agents/manager.agent.js';
import { classificationAgent } from '../agents/classification.agent.js';
import { priorityAgent } from './../agents/priority.agent.js';
import { resolutionAgent } from '../agents/resolution.agent.js';
import { routingAgent } from '../agents/routing.agent.js';
import { validationAgent } from '../agents/validation.agent.js';
import { complaintsService } from '../services/complaints.service.js';
import { auditService } from '../services/audit.service.js';
import { requireStudentAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/agent/analyze
 * Trigger the multi-agent AI workflow.
 */
router.post('/analyze', requireStudentAuth, async (req, res, next) => {
  try {
    const { problem, location } = req.body;
    if (!problem || typeof problem !== 'string' || problem.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a description of the problem.'
      });
    }

    const workflowResult = await managerAgent.processRequest({
      text: problem,
      location,
      student: req.student
    });

    res.json({
      success: true,
      workflow: workflowResult
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agent/confirm-submit
 * Mandatory Student Confirmation Gate.
 * Converts agent recommendation into an official complaint record via the Complaint API.
 */
router.post('/confirm-submit', requireStudentAuth, (req, res, next) => {
  try {
    const { analysisId, confirmedComplaint } = req.body;

    if (!confirmedComplaint || !confirmedComplaint.title || !confirmedComplaint.description) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint payload for submission.'
      });
    }

    // Verify workflow exists
    const workflow = managerAgent.getWorkflow(analysisId);
    if (analysisId && !workflow) {
      // Log for audit but proceed with payload validation
      auditService.log({
        type: 'ANALYSIS_LOOKUP_WARNING',
        studentId: req.student.id,
        details: { analysisId },
        status: 'WARNING'
      });
    }

    // Create complaint through official service with duplicate protection
    const creationResult = complaintsService.createComplaint({
      title: confirmedComplaint.title,
      description: confirmedComplaint.description,
      category: confirmedComplaint.category,
      priority: confirmedComplaint.priority,
      department: confirmedComplaint.department,
      location: confirmedComplaint.location,
      reporter: req.student.name,
      reporterEmail: req.student.email,
      studentId: req.student.id
    });

    auditService.log({
      type: 'STUDENT_APPROVAL_CONFIRMED',
      studentId: req.student.id,
      details: {
        analysisId,
        complaintId: creationResult.complaint.id,
        isDuplicate: creationResult.isDuplicate
      },
      status: 'SUCCESS'
    });

    res.status(creationResult.isDuplicate ? 200 : 201).json({
      success: true,
      isDuplicate: creationResult.isDuplicate,
      message: creationResult.message,
      complaint: creationResult.complaint
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agent/activity
 * Real-time execution states and activity dashboard feed.
 */
router.get('/activity', requireStudentAuth, (req, res) => {
  const allWorkflows = managerAgent.getAllWorkflows();
  const latest = allWorkflows[0] || null;

  // Real status of each agent based on system state
  const agentsStatus = [
    {
      id: 'manager',
      name: managerAgent.name,
      role: 'Orchestrator & Synthesizer',
      status: latest ? 'Completed' : 'Ready',
      lastActive: latest ? latest.timestamp : null,
      description: 'Coordinates planning, parallel execution, and synthesizes findings.'
    },
    {
      id: 'classification',
      name: classificationAgent.name,
      role: 'Category Identification',
      status: latest?.specialistOutputs?.classification ? 'Completed' : 'Ready',
      lastActive: latest ? latest.timestamp : null,
      description: 'Identifies Technical, Academic, Finance, or Administrative domains.'
    },
    {
      id: 'priority',
      name: priorityAgent.name,
      role: 'Urgency & Deadline Scoring',
      status: latest?.specialistOutputs?.priority ? 'Completed' : 'Ready',
      lastActive: latest ? latest.timestamp : null,
      description: 'Calculates Low, Medium, High, or Critical urgency with explicit reasoning.'
    },
    {
      id: 'resolution',
      name: resolutionAgent.name,
      role: 'Verified FAQ & Policy Solver',
      status: latest?.specialistOutputs?.resolution ? 'Completed' : 'Ready',
      lastActive: latest ? latest.timestamp : null,
      description: 'Provides strictly verified troubleshooting steps from campus policies.'
    },
    {
      id: 'routing',
      name: routingAgent.name,
      role: 'Department & Team Dispatch',
      status: latest?.specialistOutputs?.routing ? 'Completed' : 'Ready',
      lastActive: latest ? latest.timestamp : null,
      description: 'Routes issue to the correct university department and support team.'
    },
    {
      id: 'validation',
      name: validationAgent.name,
      role: 'Quality & Safety Auditor',
      status: latest?.specialistOutputs?.validation ? 'Completed' : 'Ready',
      lastActive: latest ? latest.timestamp : null,
      description: 'Audits for prompt injection, policy violations, and contradictions.'
    }
  ];

  const auditLogs = auditService.getLogs({ studentId: req.student.id, limit: 15 });

  res.json({
    success: true,
    agents: agentsStatus,
    activeWorkflow: latest,
    recentAudits: auditLogs,
    totalWorkflowsProcessed: allWorkflows.length
  });
});

/**
 * GET /api/agent/history
 * List of previous workflow executions for the student.
 */
router.get('/history', requireStudentAuth, (req, res) => {
  const workflows = managerAgent.getAllWorkflows().filter(
    (w) => w.student.id === req.student.id
  );

  res.json({
    success: true,
    count: workflows.length,
    workflows
  });
});

export default router;

