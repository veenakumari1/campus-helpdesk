import assert from 'assert';
import { managerAgent } from '../agents/manager.agent.js';
import { complaintsService } from '../services/complaints.service.js';

export async function testCompleteWorkflow() {
  console.log('  Testing End-to-End Workflow & Complaint Integration...');

  const uniqueSuffix = Date.now();
  const problemText = `Lab projector audio jack is completely broken in room ${uniqueSuffix}`;

  // 1. Run multi-agent analysis
  const workflow = await managerAgent.processRequest({
    text: problemText,
    location: `Science Hall · Room ${uniqueSuffix}`,
    student: { id: 'student-101', name: 'Veena Chen', email: 'v.chen@campus.edu' }
  });

  assert.ok(workflow.analysisId);
  assert.strictEqual(workflow.requiresStudentConfirmation, true);

  // 2. Student confirmation gate (consequential action)
  const submission = complaintsService.createComplaint({
    title: workflow.suggestedComplaint.title,
    description: workflow.suggestedComplaint.description,
    category: workflow.suggestedComplaint.category,
    priority: workflow.suggestedComplaint.priority,
    department: workflow.suggestedComplaint.department,
    location: workflow.suggestedComplaint.location,
    reporter: workflow.suggestedComplaint.reporter,
    reporterEmail: workflow.suggestedComplaint.reporterEmail,
    studentId: 'student-101'
  });

  assert.strictEqual(submission.isDuplicate, false);
  assert.ok(/^HD-\d+$/.test(submission.complaint.id));
  assert.strictEqual(submission.complaint.status, 'Pending');

  // 3. Duplicate complaint prevention test
  const duplicateAttempt = complaintsService.createComplaint({
    title: workflow.suggestedComplaint.title,
    description: workflow.suggestedComplaint.description,
    studentId: 'student-101'
  });

  assert.strictEqual(duplicateAttempt.isDuplicate, true);
  assert.strictEqual(duplicateAttempt.complaint.id, submission.complaint.id);

  // 4. Update status test
  const updated = complaintsService.updateStatus(submission.complaint.id, 'In Progress', 'student-101');
  assert.strictEqual(updated.status, 'In Progress');

  console.log('  ✓ End-to-End Workflow & Complaint Integration passed all checks.');
}

