const { createSeedState } = require('./mockData');

const STORAGE_KEY = 'randong_campus_state_v1';
let memoryState = null;

function hasWxStorage() {
  return typeof wx !== 'undefined' && wx && typeof wx.getStorageSync === 'function';
}

function getRawState() {
  if (hasWxStorage()) {
    return wx.getStorageSync(STORAGE_KEY);
  }
  return memoryState;
}

function saveRawState(state) {
  if (hasWxStorage()) {
    wx.setStorageSync(STORAGE_KEY, state);
    return;
  }
  memoryState = state;
}

function ensureSeedData() {
  const state = getRawState();
  if (!state) {
    saveRawState(createSeedState());
  }
}

function getState() {
  ensureSeedData();
  return getRawState();
}

function setState(nextState) {
  saveRawState(nextState);
  return nextState;
}

function updateState(mutator) {
  const current = getState();
  const next = mutator(current);
  return setState(next);
}

function resetState() {
  const next = createSeedState();
  saveRawState(next);
  return next;
}

module.exports = {
  ensureSeedData,
  getState,
  setState,
  updateState,
  resetState
};
