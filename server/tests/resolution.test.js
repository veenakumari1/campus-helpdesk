import assert from 'assert';
import { resolutionAgent } from '../agents/resolution.agent.js';

export async function testResolutionAgent() {
  console.log('  Testing Resolution Agent...');

  // Verified Wi-Fi FAQ matching
  const wifiRes = await resolutionAgent.run({
    text: 'Wi-Fi keeps dropping on the second floor of the main library.'
  });
  assert.strictEqual(wifiRes.status, 'Completed');
  assert.ok(Array.isArray(wifiRes.result.steps));
  assert.ok(wifiRes.result.steps.length > 0);
  assert.ok(wifiRes.result.policyReference.includes('Wi-Fi'));

  // Facilities issue (physical repair) should disallow manual physical tampering
  const leakRes = await resolutionAgent.run({
    text: 'A pipe is leaking under the sink in the student union.'
  });
  assert.strictEqual(leakRes.result.canSelfResolve, false);
  assert.ok(leakRes.result.warnings.length > 0);

  console.log('  ✓ Resolution Agent passed all checks.');
}

