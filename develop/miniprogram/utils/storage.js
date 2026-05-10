const { createSeedState } = require('./mockData');

const STORAGE_KEY = 'randong_campus_state_v1';
let memoryState = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(state) {
  const next = clone(state || createSeedState());
  if (!next.adjustments) {
    next.adjustments = {
      week_key: '',
      current_week_count: 0,
      max_per_week: 68
    };
  }
  next.adjustments.current_week_count = Number(next.adjustments.current_week_count || 0);
  next.adjustments.max_per_week = 68;
  return next;
}

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
  const state = normalizeState(getRawState());
  saveRawState(state);
  return state;
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
