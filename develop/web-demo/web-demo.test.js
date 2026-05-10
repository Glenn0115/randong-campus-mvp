const assert = require('node:assert/strict');

const {
  createInitialState,
  completeOnboarding,
  completeTask,
  adjustTask,
  createTeam,
  createInvite,
  respondToInvite,
  setAnonymousLeaderboard,
  getLeaderboards
} = require('./state');

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

test('onboarding creates two daily tasks and a route', () => {
  let state = createInitialState();
  state = completeOnboarding(state, {
    roleName: '操场新星',
    goal: '提升体能',
    sports: ['跑步', '拉伸'],
    frequency: '3-4 次',
    fitness: '新手'
  });

  assert.equal(state.user.onboarded, true);
  assert.equal(state.user.roleName, '操场新星');
  assert.equal(state.user.route, '跑步路线');
  assert.equal(state.tasks.length, 2);
});

test('completing a task increases exp, streak, and unlocks first title', () => {
  let state = completeOnboarding(createInitialState(), {
    roleName: '操场新星',
    goal: '提升体能',
    sports: ['跑步'],
    frequency: '3-4 次',
    fitness: '新手'
  });
  const taskId = state.tasks[0].id;

  state = completeTask(state, taskId, { duration: 20, sport: '散步' });

  assert.equal(state.tasks[0].status, 'completed');
  assert.equal(state.user.level, 1);
  assert.equal(state.user.exp, 30);
  assert.equal(state.user.streak, 1);
  assert.equal(state.titles.find((title) => title.id === 'first').unlocked, true);
});

test('adjusting tasks is limited to 68 times per week', () => {
  let state = completeOnboarding(createInitialState(), {
    roleName: '操场新星',
    goal: '放松',
    sports: ['拉伸'],
    frequency: '1-2 次',
    fitness: '新手'
  });
  state.tasks = Array.from({ length: 69 }, (_, index) => ({
    id: `adjustable-${index}`,
    type: '基础任务',
    title: `可调整任务 ${index + 1}`,
    description: '用于验证调整次数上限。',
    sport: '散步',
    value: 20,
    unit: '分钟',
    exp: 30,
    status: 'not-started'
  }));

  for (let index = 0; index < 68; index += 1) {
    state = adjustTask(state, `adjustable-${index}`, '考试/作业');
  }

  assert.equal(state.adjustments.used, 68);
  assert.equal(state.tasks.filter((task) => task.type === '恢复任务').length, 68);
  assert.throws(() => adjustTask(state, 'adjustable-68', '其他'), /68/);
});

test('team invite flow updates team and invite state', () => {
  let state = completeOnboarding(createInitialState(), {
    roleName: '小队发动机',
    goal: '社交娱乐',
    sports: ['球类'],
    frequency: '3-4 次',
    fitness: '一般'
  });

  state = createTeam(state, { name: '宿舍动起来', type: '宿舍队', slogan: '晚上操场见' });
  state = createInvite(state, { sport: '跑步', time: '今晚 20:00', visibility: '校园广场', note: '慢跑' });
  state = respondToInvite(state, state.invites[0].id);

  assert.equal(state.team.name, '宿舍动起来');
  assert.equal(state.invites[0].responses, 1);
});

test('anonymous leaderboard hides current user name', () => {
  let state = completeOnboarding(createInitialState(), {
    roleName: '操场新星',
    goal: '提升体能',
    sports: ['跑步'],
    frequency: '3-4 次',
    fitness: '新手'
  });
  state = completeTask(state, state.tasks[0].id, { duration: 20, sport: '散步' });
  state = setAnonymousLeaderboard(state, true);

  const leaderboards = getLeaderboards(state);

  assert.equal(leaderboards.persistence.some((entry) => entry.name === '匿名用户'), true);
});

test('loadState migrates old browser storage adjustment max from 2 to 68', () => {
  const previousStorage = global.localStorage;
  const oldState = createInitialState();
  oldState.adjustments = { used: 1, max: 2 };
  let savedValue = '';
  global.localStorage = {
    getItem() {
      return JSON.stringify(oldState);
    },
    setItem(_key, value) {
      savedValue = value;
    }
  };

  delete require.cache[require.resolve('./state')];
  const { loadState } = require('./state');
  const loaded = loadState();

  assert.equal(loaded.adjustments.used, 1);
  assert.equal(loaded.adjustments.max, 68);
  assert.equal(JSON.parse(savedValue).adjustments.max, 68);

  global.localStorage = previousStorage;
});
