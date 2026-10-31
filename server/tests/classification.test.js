import assert from 'assert';
import { classificationAgent } from '../agents/classification.agent.js';

export async function testClassificationAgent() {
  console.log('  Testing Classification Agent...');

  // Test Wi-Fi technical inquiry
  const wifiRes = await classificationAgent.run({
    text: 'My laptop cannot connect to the Wi-Fi on the 3rd floor of the library.'
  });
  assert.strictEqual(wifiRes.status, 'Completed');
  assert.strictEqual(wifiRes.result.primaryCategory, 'Technical');
  assert.strictEqual(wifiRes.result.uiCategory, 'IT & Wi-Fi');
  assert.ok(wifiRes.result.confidence >= 0.7);

  // Test Facilities plumbing issue
  const waterRes = await classificationAgent.run({
    text: 'There is water leaking rapidly from the fountain near Room 102.'
  });
  assert.strictEqual(waterRes.result.primaryCategory, 'Administrative');
  assert.strictEqual(waterRes.result.uiCategory, 'Facilities');

  // Test Tuition finance inquiry
  const tuitionRes = await classificationAgent.run({
    text: 'I have a question about my bursar tuition statement and late fee balance.'
  });
  assert.strictEqual(tuitionRes.result.primaryCategory, 'Finance');

  console.log('  ✓ Classification Agent passed all checks.');
}

