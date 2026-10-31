import { testClassificationAgent } from './classification.test.js';
import { testPriorityAgent } from './priority.test.js';
import { testResolutionAgent } from './resolution.test.js';
import { testRoutingAgent } from './routing.test.js';
import { testValidationAgent } from './validation.test.js';
import { testManagerAgent } from './manager.test.js';
import { testCompleteWorkflow } from './workflow.test.js';

async function runAllTests() {
  console.log('========================================================');
  console.log('  RUNNING CAMPUSCARE MULTI-AGENT TEST SUITE');
  console.log('========================================================\n');

  try {
    await testClassificationAgent();
    await testPriorityAgent();
    await testResolutionAgent();
    await testRoutingAgent();
    await testValidationAgent();
    await testManagerAgent();
    await testCompleteWorkflow();

    console.log('\n========================================================');
    console.log('  ALL MULTI-AGENT TESTS PASSED SUCCESSFULLY! (7/7)');
    console.log('========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed with Error:\n', err);
    process.exit(1);
  }
}

runAllTests();

