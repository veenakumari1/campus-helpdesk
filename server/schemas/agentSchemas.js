/**
 * JSON Schemas and structural validation contracts for multi-agent system.
 */

export const ClassificationSchema = {
  type: 'object',
  properties: {
    primaryCategory: {
      type: 'string',
      enum: ['Technical', 'Academic', 'Finance', 'Administrative'],
      description: 'The root category of the issue'
    },
    subCategory: {
      type: 'string',
      description: 'Specific sub-classification, e.g. Wi-Fi, LMS, Tuition, Restrooms'
    },
    uiCategory: {
      type: 'string',
      enum: ['IT & Wi-Fi', 'Classrooms', 'Facilities', 'Accounts', 'Other'],
      description: 'Corresponding UI category from the existing Campus Helpdesk'
    },
    confidence: {
      type: 'number',
      description: 'Confidence score between 0.0 and 1.0'
    },
    detectedEntities: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key keywords and nouns extracted from the request'
    }
  },
  required: ['primaryCategory', 'subCategory', 'uiCategory', 'confidence', 'detectedEntities']
};

export const PrioritySchema = {
  type: 'object',
  properties: {
    priority: {
      type: 'string',
      enum: ['Low', 'Medium', 'High', 'Critical'],
      description: 'Calculated urgency level'
    },
    uiPriority: {
      type: 'string',
      enum: ['Low', 'Normal', 'High'],
      description: 'Corresponding priority mapped to the existing Campus Helpdesk UI'
    },
    urgencyScore: {
      type: 'number',
      description: 'Score from 1 to 10 indicating immediate necessity'
    },
    isDeadlineImpacting: {
      type: 'boolean',
      description: 'Whether exams, homework due dates, or payment deadlines are imminent'
    },
    reason: {
      type: 'string',
      description: 'Detailed justification for the assigned priority level'
    }
  },
  required: ['priority', 'uiPriority', 'urgencyScore', 'isDeadlineImpacting', 'reason']
};

export const ResolutionSchema = {
  type: 'object',
  properties: {
    canSelfResolve: {
      type: 'boolean',
      description: 'Whether verified self-service steps can solve this without a technician dispatch'
    },
    steps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Ordered, actionable troubleshooting steps derived strictly from verified campus policies'
    },
    policyReference: {
      type: 'string',
      description: 'Citation of the matching verified university policy/FAQ'
    },
    warnings: {
      type: 'string',
      description: 'Important warnings (e.g. what not to touch or safety hazards)'
    }
  },
  required: ['canSelfResolve', 'steps', 'policyReference', 'warnings']
};

export const RoutingSchema = {
  type: 'object',
  properties: {
    departmentId: {
      type: 'string',
      description: 'Identifier of the target department'
    },
    departmentName: {
      type: 'string',
      description: 'Official university department name'
    },
    supportTeam: {
      type: 'string',
      description: 'Specialized support unit or team'
    },
    contactEmail: {
      type: 'string',
      description: 'Official department support email'
    },
    phone: {
      type: 'string',
      description: 'Campus telephone extension'
    },
    estimatedSLA: {
      type: 'string',
      description: 'Standard estimated resolution or initial response window'
    }
  },
  required: ['departmentId', 'departmentName', 'supportTeam', 'contactEmail', 'estimatedSLA']
};

export const ValidationSchema = {
  type: 'object',
  properties: {
    isValid: {
      type: 'boolean',
      description: 'True if all agent outputs are internally consistent, safe, and policy-grounded'
    },
    safetyAudit: {
      type: 'string',
      enum: ['Passed', 'Flagged', 'Failed'],
      description: 'Safety check status'
    },
    promptInjectionDetected: {
      type: 'boolean',
      description: 'True if input contained adversarial prompts or instruction tampering'
    },
    conflictDetected: {
      type: 'boolean',
      description: 'True if there are contradictions between classification, priority, and routing'
    },
    issuesFound: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific validation issues or warnings identified'
    },
    validationNotes: {
      type: 'string',
      description: 'Comprehensive audit summary statement'
    }
  },
  required: ['isValid', 'safetyAudit', 'promptInjectionDetected', 'conflictDetected', 'issuesFound', 'validationNotes']
};

