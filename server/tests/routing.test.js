import assert from 'assert';
import { routingAgent } from '../agents/routing.agent.js';

export async function testRoutingAgent() {
  console.log('  Testing Routing Agent...');

  // Classroom projector -> Classroom AV
  const avRes = await routingAgent.run({
    text: 'The projector in Lecture Hall B does not show an image from the lectern.',
    category: 'Classrooms'
  });
  assert.strictEqual(avRes.result.departmentId, 'classroom-av');
  assert.strictEqual(avRes.result.departmentName, 'Classroom AV & Media Support');
  assert.ok(avRes.result.contactEmail.includes('@campus.edu'));

  // Wi-Fi -> IT Services
  const wifiRes = await routingAgent.run({
    text: 'Connection drops repeatedly on Campus-Secure Wi-Fi.',
    category: 'IT & Wi-Fi'
  });
  assert.strictEqual(wifiRes.result.departmentId, 'it-services');

  // Facilities -> Facilities Operations
  const facRes = await routingAgent.run({
    text: 'Restroom water faucet will not shut off.',
    category: 'Facilities'
  });
  assert.strictEqual(facRes.result.departmentId, 'facilities-ops');

  console.log('  ✓ Routing Agent passed all checks.');
}

