const assert = require('node:assert/strict');

const {
  createTasksForUser,
  adjustTask,
  completeCheckIn,
  createTeam,
  joinTeamByCode,
  createWorkoutInvite,
  respondToInvite,
  calculateLeaderboards,
  reportRecord
} = require('../utils/domain');

const { createSeedState } = require('../utils/mockData');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

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

test('creates a basic task and a preference task for an onboarded user', () => {
  const state = createSeedState();
  const user = {
    ...state.user,
    onboarded: true,
    sport_preferences: ['running', 'stretching'],
    fitness_level: 'newbie'
  };

  const tasks = createTasksForUser(user);

  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].task_type, 'basic');
  assert.equal(tasks[1].task_type, 'preference');
  assert.equal(tasks[1].sport_type, 'running');
});

test('adjusts a task at most twice per week and creates a recovery task', () => {
  let state = createSeedState();
  state.user.onboarded = true;
  state.tasks = createTasksForUser(state.user);

  state = adjustTask(state, state.tasks[0].task_id, '考试/作业');
  state = adjustTask(state, state.tasks[1].task_id, '天气原因');

  assert.equal(state.adjustments.current_week_count, 2);
  assert.equal(state.tasks.filter((task) => task.task_type === 'recovery').length, 2);
  assert.throws(() => adjustTask(state, state.tasks[2].task_id, '其他'), /每周最多/);
});

test('completes check-in, adds exp, unlocks first title, and updates team progress', () => {
  let state = createSeedState();
  state.user.onboarded = true;
  state = createTeam(state, {
    team_name: '晨跑小队',
    team_type: '好友队',
    slogan: '一起动起来'
  });
  state.tasks = createTasksForUser(state.user, state.user.team_id);

  const task = state.tasks.find((item) => item.task_type === 'basic');
  state = completeCheckIn(state, {
    task_id: task.task_id,
    sport_type: task.sport_type,
    duration: 20,
    distance: 0,
    steps: 1800,
    note: '完成'
  });

  assert.equal(state.tasks.find((item) => item.task_id === task.task_id).status, 'completed');
  assert.ok(state.user.exp > 0);
  assert.equal(state.user.streak_days, 1);
  assert.equal(state.titles.find((title) => title.title_id === 'first_checkin').unlocked, true);
  assert.ok(state.teams[0].weekly_minutes > 0);
});

test('creates and joins team by invite code', () => {
  let state = createSeedState();
  state = joinTeamByCode(state, 'RUN2026');

  assert.equal(state.user.team_id, 'team_seed');
  assert.equal(state.teams[0].member_ids.includes(state.user.user_id), true);
});

test('creates workout invite and prevents duplicate responses', () => {
  let state = createSeedState();
  state = createWorkoutInvite(state, {
    sport_type: 'running',
    workout_time: '2026-05-10 20:00',
    visibility: 'campus',
    note: '操场慢跑'
  });
  const inviteId = state.workoutInvites[0].invite_id;

  state = respondToInvite(state, inviteId);
  state = respondToInvite(state, inviteId);

  assert.equal(state.workoutInvites[0].responder_ids.length, 1);
});

test('leaderboards exclude reported check-ins', () => {
  let state = createSeedState();
  state.user.onboarded = true;
  state.tasks = createTasksForUser(state.user);
  state = completeCheckIn(state, {
    task_id: state.tasks[0].task_id,
    sport_type: 'walking',
    duration: 20,
    steps: 2000
  });
  const checkinId = state.checkIns[0].checkin_id;

  let leaderboards = calculateLeaderboards(state);
  assert.equal(leaderboards.persistence.some((item) => item.user_id === state.user.user_id), true);

  state = reportRecord(state, {
    record_type: 'checkin',
    record_id: checkinId,
    reason: '数据异常'
  });
  leaderboards = calculateLeaderboards(state);

  assert.equal(leaderboards.persistence.some((item) => item.user_id === state.user.user_id), false);
});

test('leaderboards exclude reported seed ranking records', () => {
  let state = createSeedState();
  let leaderboards = calculateLeaderboards(state);

  assert.equal(leaderboards.persistence.some((item) => item.user_id === 'u_seed_1'), true);

  state = reportRecord(state, {
    record_type: 'leaderboard',
    record_id: 'u_seed_1',
    reason: '数据异常'
  });
  leaderboards = calculateLeaderboards(state);

  assert.equal(leaderboards.persistence.some((item) => item.user_id === 'u_seed_1'), false);
});

test('domain helpers do not mutate the previous state object', () => {
  const state = createSeedState();
  const before = clone(state);

  createTeam(state, {
    team_name: '力量小队',
    team_type: '好友队',
    slogan: ''
  });

  assert.deepEqual(state, before);
});
