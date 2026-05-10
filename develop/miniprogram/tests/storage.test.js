const assert = require('node:assert/strict');

const { createSeedState } = require('../utils/mockData');
const { getState, setState, resetState } = require('../utils/storage');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

test('getState migrates old mini program storage adjustment max from 2 to 68', () => {
  const oldState = createSeedState();
  oldState.adjustments.max_per_week = 2;
  oldState.adjustments.current_week_count = 1;

  setState(oldState);
  const loaded = getState();

  assert.equal(loaded.adjustments.current_week_count, 1);
  assert.equal(loaded.adjustments.max_per_week, 68);

  resetState();
});
