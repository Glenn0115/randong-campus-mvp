(function initStateModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.RandongState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createModule() {
  const STORAGE_KEY = 'randong_web_demo_state_v1';

  const sportRoutes = {
    '跑步': '跑步路线',
    '力量': '力量路线',
    '球类': '球类路线',
    '骑行': '综合路线',
    '拉伸': '轻运动路线',
    '散步': '轻运动路线'
  };

  const seedUsers = [
    { id: 'seed-a', name: '阿航', title: '操场常客', streak: 9, tasks: 18, current: 260, previous: 180, newbie: false },
    { id: 'seed-b', name: '小林', title: '晨跑新星', streak: 6, tasks: 11, current: 160, previous: 80, newbie: true },
    { id: 'seed-c', name: '可可', title: '坚持达人', streak: 12, tasks: 23, current: 300, previous: 260, newbie: false }
  ];

  const titleSeeds = [
    { id: 'first', name: '新手上路', condition: '完成首次打卡', unlocked: false },
    { id: 'morning', name: '晨跑新星', condition: '早晨完成 3 次跑步任务', unlocked: false },
    { id: 'regular', name: '操场常客', condition: '累计完成 10 次运动任务', unlocked: false },
    { id: 'engine', name: '小队发动机', condition: '发起 3 次约练并有人响应', unlocked: false },
    { id: 'streak7', name: '坚持达人', condition: '连续完成 7 天任务', unlocked: false }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function createInitialState() {
    return {
      user: {
        id: 'current-user',
        name: '校园同学',
        roleName: '',
        goal: '',
        sports: [],
        frequency: '',
        fitness: '',
        route: '',
        onboarded: false,
        exp: 0,
        level: 1,
        streak: 0,
        title: '',
        anonymous: false,
        shareDetails: false
      },
      tasks: [],
      checkins: [],
      team: null,
      invites: [],
      reports: [],
      titles: clone(titleSeeds),
      adjustments: {
        used: 0,
        max: 68
      }
    };
  }

  function normalizeState(state) {
    const next = clone(state || createInitialState());
    if (!next.adjustments) {
      next.adjustments = { used: 0, max: 68 };
    }
    next.adjustments.used = Number(next.adjustments.used || 0);
    next.adjustments.max = 68;
    return next;
  }

  function createDailyTasks(profile) {
    const preferred = profile.sports[0] || '散步';
    const easy = profile.fitness === '新手';
    const preferenceMap = {
      '跑步': { title: `跑步 ${easy ? 2 : 3} 公里`, value: easy ? 2 : 3, unit: '公里', exp: easy ? 45 : 55 },
      '力量': { title: `力量训练 ${easy ? 20 : 30} 分钟`, value: easy ? 20 : 30, unit: '分钟', exp: easy ? 45 : 55 },
      '球类': { title: `球类运动 ${easy ? 20 : 30} 分钟`, value: easy ? 20 : 30, unit: '分钟', exp: easy ? 45 : 55 },
      '骑行': { title: '骑行 20 分钟', value: 20, unit: '分钟', exp: 45 },
      '拉伸': { title: '拉伸 12 分钟', value: 12, unit: '分钟', exp: 35 },
      '散步': { title: '散步 20 分钟', value: 20, unit: '分钟', exp: 30 }
    };
    const preference = preferenceMap[preferred] || preferenceMap['散步'];

    return [
      {
        id: makeId('task-basic'),
        type: '基础任务',
        title: '散步 20 分钟',
        description: '低门槛健康任务，先让身体动起来。',
        sport: '散步',
        value: 20,
        unit: '分钟',
        exp: 30,
        status: 'not-started'
      },
      {
        id: makeId('task-preference'),
        type: '偏好任务',
        description: `根据你的${preferred}偏好生成。`,
        sport: preferred,
        status: 'not-started',
        ...preference
      }
    ];
  }

  function completeOnboarding(state, profile) {
    const next = clone(state);
    const roleName = String(profile.roleName || '').trim();
    if (roleName.length < 2 || roleName.length > 12) {
      throw new Error('角色名称需为 2-12 字');
    }
    if (!profile.goal || !profile.sports || profile.sports.length < 1 || !profile.frequency || !profile.fitness) {
      throw new Error('请完成全部新手引导选项');
    }

    next.user = {
      ...next.user,
      roleName,
      goal: profile.goal,
      sports: profile.sports.slice(0, 3),
      frequency: profile.frequency,
      fitness: profile.fitness,
      route: sportRoutes[profile.sports[0]] || '综合路线',
      onboarded: true
    };
    next.tasks = createDailyTasks(next.user);
    return next;
  }

  function updateTitles(next) {
    const validCheckins = next.checkins.filter((item) => item.status === 'valid');
    const respondedInvites = next.invites.filter((invite) => invite.responses > 0).length;

    next.titles = next.titles.map((title) => {
      if (title.id === 'first' && validCheckins.length >= 1) return { ...title, unlocked: true };
      if (title.id === 'regular' && validCheckins.length >= 10) return { ...title, unlocked: true };
      if (title.id === 'engine' && respondedInvites >= 3) return { ...title, unlocked: true };
      if (title.id === 'streak7' && next.user.streak >= 7) return { ...title, unlocked: true };
      return title;
    });

    if (!next.user.title) {
      const first = next.titles.find((title) => title.unlocked);
      if (first) next.user.title = first.name;
    }
  }

  function completeTask(state, taskId, payload) {
    const next = clone(state);
    const task = next.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error('任务不存在');
    if (task.status === 'completed') throw new Error('任务已完成');

    const duration = Number(payload.duration || 0);
    if (duration <= 0) throw new Error('请输入有效时长');

    task.status = 'completed';
    const checkin = {
      id: makeId('checkin'),
      taskId,
      sport: payload.sport || task.sport,
      duration,
      note: payload.note || '',
      status: duration > 360 ? 'reviewing' : 'valid'
    };
    next.checkins.unshift(checkin);

    if (checkin.status === 'valid') {
      next.user.exp += task.exp;
      next.user.level = Math.floor(next.user.exp / 100) + 1;
      next.user.streak += 1;
      if (next.team) {
        next.team.minutes += duration;
      }
    }
    updateTitles(next);
    return next;
  }

  function adjustTask(state, taskId, reason) {
    const next = clone(state);
    if (next.adjustments.used >= next.adjustments.max) {
      throw new Error(`每周最多调整 ${next.adjustments.max} 次任务`);
    }
    const task = next.tasks.find((item) => item.id === taskId);
    if (!task) throw new Error('任务不存在');
    if (task.status === 'completed') throw new Error('已完成任务不能调整');

    task.status = 'adjusted';
    task.adjustReason = reason;
    next.adjustments.used += 1;
    next.tasks.push({
      id: makeId('task-recovery'),
      type: '恢复任务',
      title: next.adjustments.used === 1 ? '拉伸 8 分钟' : '散步 10 分钟',
      description: '上传理由后自动生成，完成后保留连续记录。',
      sport: next.adjustments.used === 1 ? '拉伸' : '散步',
      value: next.adjustments.used === 1 ? 8 : 10,
      unit: '分钟',
      exp: Math.max(5, Math.round(task.exp * 0.3)),
      status: 'not-started'
    });
    return next;
  }

  function createTeam(state, payload) {
    const next = clone(state);
    const name = String(payload.name || '').trim();
    if (name.length < 2 || name.length > 12) throw new Error('小队名称需为 2-12 字');
    next.team = {
      id: makeId('team'),
      name,
      type: payload.type || '好友队',
      slogan: payload.slogan || '',
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      captainId: next.user.id,
      minutes: 0,
      target: 600,
      members: [
        { id: next.user.id, name: next.user.roleName || next.user.name, title: next.user.title || '新手上路' },
        { id: 'seed-a', name: '阿航', title: '操场常客' },
        { id: 'seed-b', name: '小林', title: '晨跑新星' }
      ]
    };
    return next;
  }

  function createInvite(state, payload) {
    const next = clone(state);
    if (!payload.sport || !payload.time) throw new Error('请选择运动类型和时间');
    next.invites.unshift({
      id: makeId('invite'),
      creatorId: next.user.id,
      sport: payload.sport,
      time: payload.time,
      visibility: payload.visibility || '好友/小队',
      note: String(payload.note || '').slice(0, 50),
      responses: 0,
      responded: false
    });
    return next;
  }

  function respondToInvite(state, inviteId) {
    const next = clone(state);
    const invite = next.invites.find((item) => item.id === inviteId);
    if (!invite) throw new Error('约练不存在');
    if (!invite.responded) {
      invite.responded = true;
      invite.responses += 1;
    }
    updateTitles(next);
    return next;
  }

  function setAnonymousLeaderboard(state, enabled) {
    const next = clone(state);
    next.user.anonymous = !!enabled;
    return next;
  }

  function setShareDetails(state, enabled) {
    const next = clone(state);
    next.user.shareDetails = !!enabled;
    return next;
  }

  function reportRecord(state, recordId, reason) {
    const next = clone(state);
    if (!next.reports.some((report) => report.recordId === recordId)) {
      next.reports.unshift({ id: makeId('report'), recordId, reason, status: '复核中' });
    }
    return next;
  }

  function getLeaderboards(state) {
    const reported = new Set(state.reports.map((report) => report.recordId));
    const currentEntry = state.checkins.some((item) => item.status === 'valid')
      ? {
          id: state.user.id,
          name: state.user.anonymous ? '匿名用户' : (state.user.roleName || state.user.name),
          title: state.user.title || '新手上路',
          streak: state.user.streak,
          tasks: state.checkins.filter((item) => item.status === 'valid').length,
          current: state.checkins.reduce((sum, item) => sum + (item.status === 'valid' ? item.duration : 0), 0),
          previous: 0,
          newbie: true
        }
      : null;
    const users = currentEntry ? [...seedUsers, currentEntry] : [...seedUsers];
    const filteredUsers = users.filter((user) => !reported.has(user.id));
    const teams = [
      { id: 'team-seed', name: '操场慢跑队', type: '好友队', members: 3, completion: 72 },
      ...(state.team ? [{ id: state.team.id, name: state.team.name, type: state.team.type, members: state.team.members.length, completion: Math.round((state.team.minutes / state.team.target) * 100) }] : [])
    ].filter((team) => !reported.has(team.id));

    return {
      persistence: filteredUsers
        .slice()
        .sort((a, b) => b.streak - a.streak)
        .map((item, index) => ({ ...item, rank: index + 1, metric: `${item.streak} 天` })),
      progress: filteredUsers
        .map((item) => ({ ...item, improvement: Math.max(0, item.current - item.previous) }))
        .sort((a, b) => b.improvement - a.improvement)
        .map((item, index) => ({ ...item, rank: index + 1, metric: `提升 ${item.improvement} 分钟` })),
      teams: teams
        .sort((a, b) => b.completion - a.completion)
        .map((item, index) => ({ ...item, rank: index + 1, metric: `${item.completion}%` })),
      newbie: filteredUsers
        .filter((item) => item.newbie)
        .sort((a, b) => b.tasks - a.tasks)
        .map((item, index) => ({ ...item, rank: index + 1, metric: `${item.tasks} 次` }))
    };
  }

  function loadState() {
    if (typeof localStorage === 'undefined') return createInitialState();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    try {
      const migrated = normalizeState(JSON.parse(raw));
      saveState(migrated);
      return migrated;
    } catch (error) {
      return createInitialState();
    }
  }

  function saveState(state) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    return state;
  }

  function resetState() {
    const state = createInitialState();
    saveState(state);
    return state;
  }

  return {
    createInitialState,
    completeOnboarding,
    completeTask,
    adjustTask,
    createTeam,
    createInvite,
    respondToInvite,
    setAnonymousLeaderboard,
    setShareDetails,
    reportRecord,
    getLeaderboards,
    loadState,
    saveState,
    resetState
  };
});
