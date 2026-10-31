import assert from 'assert';
import { managerAgent } from '../agents/manager.agent.js';

export async function testManagerAgent() {
  console.log('  Testing Manager / Orchestrator Agent...');

  const workflow = await managerAgent.processRequest({
    text: 'Cannot connect to Campus-Secure Wi-Fi on the 2nd floor of Main Library during study session.',
    location: 'Main Library · Floor 2',
    student: { id: 'student-101', name: 'Veena Chen', email: 'v.chen@campus.edu' }
  });

  assert.ok(workflow.analysisId.startsWith('WF-'));
  assert.strictEqual(workflow.plan.stages.length, 4);
  assert.ok(workflow.timeline.length >= 6);
  assert.ok(workflow.executionTimeMs >= 0);

  // Verify specialist outputs aggregated
  assert.ok(workflow.specialistOutputs.classification);
  assert.ok(workflow.specialistOutputs.priority);
  assert.ok(workflow.specialistOutputs.resolution);
  assert.ok(workflow.specialistOutputs.routing);
  assert.ok(workflow.specialistOutputs.validation);

  // Verify synthesis and confirmation requirements
  assert.strictEqual(workflow.requiresStudentConfirmation, true);
  assert.strictEqual(workflow.suggestedComplaint.category, 'IT & Wi-Fi');
  assert.strictEqual(workflow.suggestedComplaint.reporter, 'Veena Chen');

  console.log('  ✓ Manager Agent passed all checks.');
}

