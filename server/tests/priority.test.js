import assert from 'assert';
import { priorityAgent } from '../agents/priority.agent.js';

export async function testPriorityAgent() {
  console.log('  Testing Priority Agent...');

  // Critical hazard test
  const critRes = await priorityAgent.run({
    text: 'Urgent emergency! There is water flooding near electrical sockets in the basement lab!'
  });
  assert.strictEqual(critRes.result.priority, 'Critical');
  assert.strictEqual(critRes.result.uiPriority, 'High');
  assert.ok(critRes.result.urgencyScore >= 9);

  // High urgency exam / deadline test
  const highRes = await priorityAgent.run({
    text: 'My midterm exam starts in 2 hours and my student portal login is completely locked out!'
  });
  assert.strictEqual(highRes.result.priority, 'High');
  assert.strictEqual(highRes.result.uiPriority, 'High');
  assert.strictEqual(highRes.result.isDeadlineImpacting, true);

  // Low urgency cosmetic test
  const lowRes = await priorityAgent.run({
    text: 'The water fountain has a small cosmetic scratch on the basin.'
  });
  assert.strictEqual(lowRes.result.priority, 'Low');
  assert.strictEqual(lowRes.result.uiPriority, 'Low');

  console.log('  ✓ Priority Agent passed all checks.');
}

