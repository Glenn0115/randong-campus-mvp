const { SPORT_OPTIONS, TASK_STATUS, INVITE_STATUS } = require('./constants');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function weekKey(date = new Date()) {
  const firstDay = new Date(date);
  firstDay.setHours(0, 0, 0, 0);
  firstDay.setDate(firstDay.getDate() - firstDay.getDay());
  return firstDay.toISOString().slice(0, 10);
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function optionLabel(value) {
  const option = SPORT_OPTIONS.find((item) => item.value === value);
  return option ? option.label : '运动';
}

function routeForSport(value) {
  const option = SPORT_OPTIONS.find((item) => item.value === value);
  return option ? option.route : '综合路线';
}

function taskForSport(sportType, fitnessLevel) {
  const easy = fitnessLevel === 'newbie';
  const normalMinutes = easy ? 20 : 30;
  const runningDistance = easy ? 2 : 3;

  const templates = {
    running: {
      title: `跑步 ${runningDistance} 公里`,
      description: '按自己的节奏完成，不追求配速。',
      target_value: runningDistance,
      target_unit: '公里',
      exp_reward: easy ? 45 : 55
    },
    strength: {
      title: `力量训练 ${normalMinutes} 分钟`,
      description: '完成自重或器械训练，注意热身。',
      target_value: normalMinutes,
      target_unit: '分钟',
      exp_reward: easy ? 45 : 55
    },
    ball: {
      title: `球类运动 ${normalMinutes} 分钟`,
      description: '篮球、羽毛球、乒乓球都可以。',
      target_value: normalMinutes,
      target_unit: '分钟',
      exp_reward: easy ? 45 : 55
    },
    cycling: {
      title: '骑行 20 分钟',
      description: '校园或周边慢骑，注意安全。',
      target_value: 20,
      target_unit: '分钟',
      exp_reward: 45
    },
    stretching: {
      title: '拉伸 12 分钟',
      description: '放松肩颈、腰背和腿部。',
      target_value: 12,
      target_unit: '分钟',
      exp_reward: 35
    },
    walking: {
      title: '散步 20 分钟',
      description: '从低门槛开始，先让身体动起来。',
      target_value: 20,
      target_unit: '分钟',
      exp_reward: 30
    }
  };

  return templates[sportType] || templates.walking;
}

function createTasksForUser(user, teamId = '') {
  const createdAt = nowIso();
  const baseTask = {
    task_id: makeId('task_basic'),
    user_id: user.user_id,
    team_id: '',
    task_type: 'basic',
    title: '散步 20 分钟',
    description: '从低门槛开始，先让身体动起来。',
    sport_type: 'walking',
    target_value: 20,
    target_unit: '分钟',
    exp_reward: 30,
    status: TASK_STATUS.NOT_STARTED,
    adjusted: false,
    created_at: createdAt,
    expired_at: `${todayKey()} 23:59:59`
  };
  const primarySport = user.sport_preferences && user.sport_preferences[0] ? user.sport_preferences[0] : 'walking';
  const preferenceTemplate = taskForSport(primarySport, user.fitness_level);
  const preferenceTask = {
    task_id: makeId('task_pref'),
    user_id: user.user_id,
    team_id: '',
    task_type: 'preference',
    sport_type: primarySport,
    status: TASK_STATUS.NOT_STARTED,
    adjusted: false,
    created_at: createdAt,
    expired_at: `${todayKey()} 23:59:59`,
    ...preferenceTemplate
  };
  const tasks = [baseTask, preferenceTask];

  if (teamId) {
    tasks.push({
      task_id: makeId('task_team'),
      user_id: '',
      team_id: teamId,
      task_type: 'social',
      title: '小队累计运动 90 分钟',
      description: '全队一起累计运动时间，谁有空谁贡献。',
      sport_type: 'mixed',
      target_value: 90,
      target_unit: '分钟',
      exp_reward: 20,
      progress_value: 0,
      status: TASK_STATUS.NOT_STARTED,
      adjusted: false,
      created_at: createdAt,
      expired_at: `${todayKey()} 23:59:59`
    });
  }

  return tasks;
}

function normalizeAdjustmentCounter(state) {
  const next = clone(state);
  const currentWeek = weekKey();
  if (next.adjustments.week_key !== currentWeek) {
    next.adjustments.week_key = currentWeek;
    next.adjustments.current_week_count = 0;
  }
  return next;
}

function adjustTask(state, taskId, reason) {
  const next = normalizeAdjustmentCounter(state);
  if (next.adjustments.current_week_count >= next.adjustments.max_per_week) {
    throw new Error('每周最多调整 2 次任务');
  }

  const task = next.tasks.find((item) => item.task_id === taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  if (task.status === TASK_STATUS.COMPLETED) {
    throw new Error('已完成任务不能调整');
  }

  task.status = TASK_STATUS.ADJUSTED;
  task.adjusted = true;
  task.adjust_reason = reason;
  next.adjustments.current_week_count += 1;

  const recoveryTemplates = [
    { title: '拉伸 8 分钟', sport_type: 'stretching', target_value: 8 },
    { title: '散步 10 分钟', sport_type: 'walking', target_value: 10 },
    { title: '呼吸放松 5 分钟', sport_type: 'stretching', target_value: 5 }
  ];
  const recovery = recoveryTemplates[(next.adjustments.current_week_count - 1) % recoveryTemplates.length];
  next.tasks.push({
    task_id: makeId('task_recovery'),
    user_id: next.user.user_id,
    team_id: '',
    task_type: 'recovery',
    title: recovery.title,
    description: '恢复任务用于保留连续记录，经验为原任务的 30%。',
    sport_type: recovery.sport_type,
    target_value: recovery.target_value,
    target_unit: '分钟',
    exp_reward: Math.max(5, Math.round(task.exp_reward * 0.3)),
    status: TASK_STATUS.NOT_STARTED,
    adjusted: false,
    source_task_id: task.task_id,
    created_at: nowIso(),
    expired_at: `${todayKey()} 23:59:59`
  });

  return next;
}

function expToLevel(exp) {
  return Math.max(1, Math.floor(exp / 100) + 1);
}

function isAbnormalCheckIn(payload) {
  const duration = Number(payload.duration || 0);
  const distance = Number(payload.distance || 0);
  const steps = Number(payload.steps || 0);

  return duration > 360 || distance > 80 || steps > 100000 || duration <= 0;
}

function updateTitles(next) {
  const validCheckIns = next.checkIns.filter((item) => item.status === 'valid');
  const inviteCount = next.workoutInvites.filter((invite) => invite.creator_id === next.user.user_id && invite.responder_ids.length > 0).length;
  const morningRunningCount = validCheckIns.filter((item) => {
    const hour = new Date(item.created_at).getHours();
    return item.sport_type === 'running' && hour >= 5 && hour < 10;
  }).length;

  next.titles = next.titles.map((title) => {
    if (title.title_id === 'first_checkin' && validCheckIns.length >= 1) {
      return { ...title, unlocked: true };
    }
    if (title.title_id === 'morning_runner' && morningRunningCount >= 3) {
      return { ...title, unlocked: true };
    }
    if (title.title_id === 'playground_regular' && validCheckIns.length >= 10) {
      return { ...title, unlocked: true };
    }
    if (title.title_id === 'team_engine' && inviteCount >= 3) {
      return { ...title, unlocked: true };
    }
    if (title.title_id === 'persistence_7' && next.user.streak_days >= 7) {
      return { ...title, unlocked: true };
    }
    return title;
  });

  if (!next.user.display_title) {
    const firstUnlocked = next.titles.find((title) => title.unlocked);
    if (firstUnlocked) {
      next.user.display_title = firstUnlocked.name;
    }
  }
}

function completeCheckIn(state, payload) {
  const next = clone(state);
  const task = next.tasks.find((item) => item.task_id === payload.task_id);
  const abnormal = isAbnormalCheckIn(payload);
  const checkin = {
    checkin_id: makeId('checkin'),
    user_id: next.user.user_id,
    task_id: payload.task_id || '',
    sport_type: payload.sport_type,
    duration: Number(payload.duration || 0),
    distance: Number(payload.distance || 0),
    steps: Number(payload.steps || 0),
    note: payload.note || '',
    image_enabled: !!payload.image_enabled,
    location_enabled: !!payload.location_enabled,
    health_data_enabled: !!payload.health_data_enabled,
    status: abnormal ? 'reviewing' : 'valid',
    created_at: nowIso()
  };

  next.checkIns.unshift(checkin);

  if (task) {
    task.status = abnormal ? 'reviewing' : TASK_STATUS.COMPLETED;
    task.completed_at = nowIso();
  }

  if (!abnormal) {
    const reward = task ? task.exp_reward : 20;
    next.user.exp += reward;
    next.user.level = expToLevel(next.user.exp);
    next.user.streak_days += 1;
    next.user.this_week_minutes = Number(next.user.this_week_minutes || 0) + checkin.duration;
    next.user.task_count = Number(next.user.task_count || 0) + 1;
  }

  if (!abnormal && next.user.team_id) {
    const team = next.teams.find((item) => item.team_id === next.user.team_id);
    if (team) {
      team.weekly_minutes = Number(team.weekly_minutes || 0) + checkin.duration;
      team.today_checkins = Number(team.today_checkins || 0) + 1;
    }
    next.tasks
      .filter((item) => item.team_id === next.user.team_id && item.task_type === 'social')
      .forEach((item) => {
        item.progress_value = Math.min(item.target_value, Number(item.progress_value || 0) + checkin.duration);
        if (item.progress_value >= item.target_value) {
          item.status = TASK_STATUS.COMPLETED;
        }
      });
  }

  updateTitles(next);
  return next;
}

function createTeam(state, payload) {
  const next = clone(state);
  const teamName = String(payload.team_name || '').trim();
  if (teamName.length < 2 || teamName.length > 12) {
    throw new Error('小队名称需为 2-12 字');
  }

  const team = {
    team_id: makeId('team'),
    team_name: teamName,
    team_type: payload.team_type || '好友队',
    captain_id: next.user.user_id,
    member_ids: [next.user.user_id],
    members: [
      {
        user_id: next.user.user_id,
        nickname: next.user.nickname,
        title: next.user.display_title || '新手上路'
      }
    ],
    invite_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    slogan: payload.slogan || '',
    weekly_minutes: 0,
    weekly_target: 600,
    today_checkins: 0,
    created_at: nowIso()
  };

  next.teams.unshift(team);
  next.user.team_id = team.team_id;
  return next;
}

function joinTeamByCode(state, inviteCode) {
  const next = clone(state);
  const code = String(inviteCode || '').trim().toUpperCase();
  const team = next.teams.find((item) => item.invite_code === code);
  if (!team) {
    throw new Error('口令无效');
  }
  if (!team.member_ids.includes(next.user.user_id)) {
    if (team.member_ids.length >= 8) {
      throw new Error('小队人数已满');
    }
    team.member_ids.push(next.user.user_id);
    team.members.push({
      user_id: next.user.user_id,
      nickname: next.user.nickname,
      title: next.user.display_title || '新手上路'
    });
  }
  next.user.team_id = team.team_id;
  return next;
}

function createWorkoutInvite(state, payload) {
  const next = clone(state);
  const note = String(payload.note || '').slice(0, 50);
  if (!payload.sport_type) {
    throw new Error('请选择运动类型');
  }
  if (!payload.workout_time) {
    throw new Error('请选择约练时间');
  }

  next.workoutInvites.unshift({
    invite_id: makeId('invite'),
    creator_id: next.user.user_id,
    creator_name: next.user.nickname,
    team_id: next.user.team_id || '',
    sport_type: payload.sport_type,
    sport_label: optionLabel(payload.sport_type),
    workout_time: payload.workout_time,
    visibility: payload.visibility || 'team',
    note,
    status: INVITE_STATUS.RECRUITING,
    responder_ids: [],
    responder_names: [],
    responder_count: 0,
    created_at: nowIso()
  });

  updateTitles(next);
  return next;
}

function respondToInvite(state, inviteId) {
  const next = clone(state);
  const invite = next.workoutInvites.find((item) => item.invite_id === inviteId);
  if (!invite) {
    throw new Error('约练不存在');
  }
  if (invite.status !== INVITE_STATUS.RECRUITING) {
    throw new Error('约练已结束');
  }
  if (!invite.responder_ids.includes(next.user.user_id)) {
    invite.responder_ids.push(next.user.user_id);
    invite.responder_names.push(next.user.nickname);
    invite.responder_count = invite.responder_ids.length;
  }
  updateTitles(next);
  return next;
}

function validCheckIns(state) {
  return state.checkIns.filter((item) => item.status === 'valid');
}

function calculateLeaderboards(state) {
  const currentTitle = state.user.display_title || '新手上路';
  const anonymous = state.user.privacy_setting && state.user.privacy_setting.anonymous_leaderboard;
  const currentUserCheckIns = validCheckIns(state).filter((item) => item.user_id === state.user.user_id);
  const reportedLeaderboardIds = new Set(
    state.reports
      .filter((report) => report.record_type === 'leaderboard')
      .map((report) => report.record_id)
  );
  const currentUserEntry = currentUserCheckIns.length > 0
    ? {
        user_id: state.user.user_id,
        record_id: currentUserCheckIns[0].checkin_id,
        nickname: anonymous ? '匿名用户' : state.user.nickname,
        avatar: state.user.avatar,
        title: currentTitle,
        streak_days: state.user.streak_days,
        task_count: state.user.task_count || currentUserCheckIns.length,
        this_week_minutes: state.user.this_week_minutes || currentUserCheckIns.reduce((sum, item) => sum + item.duration, 0),
        last_week_minutes: state.user.last_week_minutes || 0,
        created_at: state.user.created_at
      }
    : null;
  const users = [...(state.seedRankings ? state.seedRankings.users : [])]
    .filter((item) => !reportedLeaderboardIds.has(item.user_id));
  if (currentUserEntry) {
    users.push(currentUserEntry);
  }

  const persistence = users
    .filter((item) => item.user_id !== state.user.user_id || currentUserCheckIns.length > 0)
    .sort((a, b) => b.streak_days - a.streak_days)
    .map((item, index) => ({ ...item, rank: index + 1, metric: `${item.streak_days} 天` }));

  const progress = users
    .map((item) => ({
      ...item,
      improvement: Math.max(0, Number(item.this_week_minutes || 0) - Number(item.last_week_minutes || 0))
    }))
    .sort((a, b) => b.improvement - a.improvement)
    .map((item, index) => ({ ...item, rank: index + 1, metric: `提升 ${item.improvement} 分钟` }));

  const teams = state.teams
    .map((team) => ({
      ...team,
      completion: Math.round((Number(team.weekly_minutes || 0) / Number(team.weekly_target || 600)) * 100)
    }))
    .sort((a, b) => b.completion - a.completion)
    .map((team, index) => ({ ...team, rank: index + 1, metric: `${team.completion}%` }));

  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const newbie = users
    .filter((item) => now - new Date(item.created_at).getTime() <= fourteenDaysMs)
    .sort((a, b) => b.task_count - a.task_count)
    .map((item, index) => ({ ...item, rank: index + 1, metric: `${item.task_count} 次` }));

  return {
    persistence,
    progress,
    teams,
    newbie
  };
}

function reportRecord(state, payload) {
  const next = clone(state);
  const exists = next.reports.some((report) => report.record_id === payload.record_id && report.reporter_id === next.user.user_id);
  if (exists) {
    return next;
  }
  next.reports.unshift({
    report_id: makeId('report'),
    reporter_id: next.user.user_id,
    record_type: payload.record_type,
    record_id: payload.record_id,
    reason: payload.reason,
    status: 'reviewing',
    created_at: nowIso()
  });

  if (payload.record_type === 'checkin') {
    const checkin = next.checkIns.find((item) => item.checkin_id === payload.record_id);
    if (checkin) {
      checkin.status = 'reported';
    }
  }

  return next;
}

module.exports = {
  todayKey,
  weekKey,
  routeForSport,
  createTasksForUser,
  adjustTask,
  completeCheckIn,
  createTeam,
  joinTeamByCode,
  createWorkoutInvite,
  respondToInvite,
  calculateLeaderboards,
  reportRecord
};
