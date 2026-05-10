const {
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
} = window.RandongState;

const app = document.querySelector('#app');
let state = loadState();
let currentView = state.user.onboarded ? 'home' : 'onboarding';

const goals = ['减脂', '增肌', '放松', '提升体能', '社交娱乐'];
const sports = ['跑步', '力量', '球类', '骑行', '拉伸', '散步'];
const frequencies = ['1-2 次', '3-4 次', '5 次以上'];
const fitnessLevels = ['新手', '一般', '较活跃'];
const adjustmentReasons = ['考试/作业', '身体不适', '天气原因', '课程/活动冲突', '其他'];
const tabs = ['home', 'tasks', 'team', 'growth', 'leaderboard'];
const tabLabels = {
  home: '首页',
  tasks: '任务',
  team: '小队',
  growth: '成长',
  leaderboard: '排行'
};

function persist(nextState) {
  state = saveState(nextState);
  render();
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 1800);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setView(view) {
  currentView = view;
  render();
}

function updateTabs() {
  document.querySelectorAll('.tab').forEach((button) => {
    const view = button.dataset.view;
    button.classList.toggle('active', view === currentView);
    button.disabled = !state.user.onboarded && view !== 'home';
  });
}

function taskStatusLabel(status) {
  const map = {
    'not-started': '未开始',
    completed: '已完成',
    adjusted: '已调整',
    reviewing: '复核中'
  };
  return map[status] || status;
}

function taskCards(tasks) {
  return tasks.map((task) => `
    <article class="card task-card">
      <div class="row">
        <div>
          <div class="task-name">${escapeHtml(task.title)}</div>
          <div class="muted">${escapeHtml(task.description)}</div>
        </div>
        <span class="badge">${taskStatusLabel(task.status)}</span>
      </div>
      <div class="meta">
        <span>${escapeHtml(task.type)}</span>
        <span>${escapeHtml(task.value)}${escapeHtml(task.unit)}</span>
        <span>${escapeHtml(task.exp)} EXP</span>
      </div>
      <div class="row actions">
        <button class="button" data-action="complete-task" data-task-id="${task.id}" ${task.status === 'completed' || task.status === 'adjusted' ? 'disabled' : ''}>提交打卡</button>
        <button class="button ghost" data-action="adjust-task" data-task-id="${task.id}" ${task.status === 'completed' || task.status === 'adjusted' || state.adjustments.used >= state.adjustments.max ? 'disabled' : ''}>调整任务</button>
      </div>
    </article>
  `).join('');
}

function renderOnboarding() {
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <p class="muted">Web Demo</p>
        <h1 class="title">创建你的运动角色</h1>
        <p class="muted">不用微信开发者工具，浏览器打开即可体验 MVP 主流程。</p>
      </article>

      <form class="card stack" data-form="onboarding">
        <label class="field">
          <span class="label">角色名称</span>
          <input class="input" name="roleName" maxlength="12" value="操场新星" />
        </label>

        <label class="field">
          <span class="label">运动目标</span>
          <select class="select" name="goal">${goals.map((goal) => `<option>${goal}</option>`).join('')}</select>
        </label>

        <div class="field">
          <span class="label">运动偏好，最多 3 项</span>
          <div class="option-row" data-group="sports">
            ${sports.map((sport, index) => `<button type="button" class="chip ${index === 0 ? 'active' : ''}" data-sport="${sport}">${sport}</button>`).join('')}
          </div>
        </div>

        <label class="field">
          <span class="label">每周运动频率</span>
          <select class="select" name="frequency">${frequencies.map((item) => `<option>${item}</option>`).join('')}</select>
        </label>

        <label class="field">
          <span class="label">当前运动基础</span>
          <select class="select" name="fitness">${fitnessLevels.map((item) => `<option>${item}</option>`).join('')}</select>
        </label>

        <button class="button" type="submit">生成今日任务</button>
      </form>
    </section>
  `;
}

function renderHome() {
  const user = state.user;
  const team = state.team;
  const expPercent = user.exp % 100;
  const teamPercent = team ? Math.min(100, Math.round((team.minutes / team.target) * 100)) : 0;
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <div class="row">
          <div>
            <p class="muted">今天也让身体上线</p>
            <h1 class="title">${escapeHtml(user.roleName || user.name)}</h1>
          </div>
          <span class="badge">Lv.${user.level}</span>
        </div>
        <div class="meta">
          <span>${escapeHtml(user.route || '综合路线')}</span>
          <span>${escapeHtml(user.title || '新手上路')}</span>
          <span>连续 ${user.streak} 天</span>
        </div>
        <div class="progress"><span style="width:${expPercent}%"></span></div>
      </article>

      <div class="grid">
        <button class="button" data-action="quick-checkin">快捷打卡</button>
        <button class="button secondary" data-action="go-invite">发布约练</button>
      </div>

      <section>
        <div class="row">
          <h2 class="section-title">今日任务</h2>
          <button class="button ghost" data-view-link="tasks">查看全部</button>
        </div>
        <div class="grid">${taskCards(state.tasks.slice(0, 2))}</div>
      </section>

      <article class="card" ${team ? '' : 'hidden'}>
        <div class="row">
          <div>
            <h2 class="section-title">${escapeHtml(team ? team.name : '')}</h2>
            <p class="muted">本周累计 ${team ? team.minutes : 0} / ${team ? team.target : 600} 分钟</p>
          </div>
          <span class="badge">小队</span>
        </div>
        <div class="progress"><span style="width:${teamPercent}%"></span></div>
      </article>
    </section>
  `;
}

function renderTasks() {
  const grouped = ['基础任务', '偏好任务', '恢复任务']
    .map((type) => ({ type, tasks: state.tasks.filter((task) => task.type === type) }))
    .filter((group) => group.tasks.length);
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <h1 class="title">今日任务</h1>
        <p class="muted">剩余调整次数 ${state.adjustments.max - state.adjustments.used} / ${state.adjustments.max}</p>
      </article>
      ${grouped.map((group) => `
        <section>
          <h2 class="section-title">${group.type}</h2>
          <div class="grid">${taskCards(group.tasks)}</div>
        </section>
      `).join('')}
    </section>
  `;
}

function renderTeam() {
  if (!state.team) {
    app.innerHTML = `
      <section class="shell">
        <article class="card">
          <h1 class="title">还没有小队</h1>
          <p class="muted">创建宿舍队、好友队，或者体验示例小队流程。</p>
        </article>
        <form class="card stack" data-form="team">
          <label class="field"><span class="label">小队名称</span><input class="input" name="name" value="宿舍动起来" maxlength="12" /></label>
          <label class="field"><span class="label">小队类型</span><select class="select" name="type"><option>宿舍队</option><option>好友队</option><option>班级队</option><option>社团队</option></select></label>
          <label class="field"><span class="label">小队宣言</span><input class="input" name="slogan" value="晚上操场见" maxlength="30" /></label>
          <button class="button" type="submit">创建小队</button>
        </form>
      </section>
    `;
    return;
  }

  const team = state.team;
  const percent = Math.min(100, Math.round((team.minutes / team.target) * 100));
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <div class="row">
          <div>
            <h1 class="title">${escapeHtml(team.name)}</h1>
            <p class="muted">${escapeHtml(team.type)} · ${escapeHtml(team.slogan)}</p>
          </div>
          <span class="badge">口令 ${team.inviteCode}</span>
        </div>
        <div class="progress"><span style="width:${percent}%"></span></div>
        <p class="muted">本周 ${team.minutes} / ${team.target} 分钟</p>
      </article>
      <section>
        <h2 class="section-title">成员</h2>
        <div class="three-grid">
          ${team.members.map((member) => `
            <article class="card member-card">
              <strong>${escapeHtml(member.name)}</strong>
              <span class="muted">${escapeHtml(member.title)}</span>
            </article>
          `).join('')}
        </div>
      </section>
      <section>
        <div class="row">
          <h2 class="section-title">约练时间卡</h2>
          <button class="button ghost" data-action="go-invite">发起</button>
        </div>
        <div class="grid">
          ${state.invites.length ? state.invites.map(inviteCard).join('') : '<article class="card"><p class="muted">暂无约练时间卡。</p></article>'}
        </div>
      </section>
    </section>
  `;
}

function inviteCard(invite) {
  return `
    <article class="card invite-card">
      <div class="row">
        <div>
          <strong>${escapeHtml(invite.sport)}</strong>
          <p class="muted">${escapeHtml(invite.time)} · ${escapeHtml(invite.visibility)}</p>
        </div>
        <span class="badge">${invite.responses} 人响应</span>
      </div>
      <p class="muted">${escapeHtml(invite.note || '无备注')}</p>
      <button class="button secondary" data-action="respond-invite" data-invite-id="${invite.id}" ${invite.responded ? 'disabled' : ''}>${invite.responded ? '已响应' : '我也去'}</button>
    </article>
  `;
}

function renderInvite() {
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <h1 class="title">约练时间卡</h1>
        <p class="muted">只约时间和运动类型，降低找搭子的门槛。</p>
      </article>
      <form class="card stack" data-form="invite">
        <label class="field"><span class="label">运动类型</span><select class="select" name="sport">${sports.map((sport) => `<option>${sport}</option>`).join('')}</select></label>
        <label class="field"><span class="label">约练时间</span><input class="input" name="time" value="今晚 20:00" /></label>
        <label class="field"><span class="label">可见范围</span><select class="select" name="visibility"><option>好友/小队</option><option>校园广场</option></select></label>
        <label class="field"><span class="label">备注</span><textarea class="textarea" name="note" maxlength="50">操场慢跑，不卷配速</textarea></label>
        <button class="button" type="submit">发布约练</button>
      </form>
      <section>
        <h2 class="section-title">可响应约练</h2>
        <div class="grid">${state.invites.length ? state.invites.map(inviteCard).join('') : '<article class="card"><p class="muted">暂无公开或小队约练。</p></article>'}</div>
      </section>
    </section>
  `;
}

function renderGrowth() {
  const unlocked = state.titles.filter((title) => title.unlocked);
  const locked = state.titles.filter((title) => !title.unlocked);
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <p class="muted">当前路线</p>
        <h1 class="title">${escapeHtml(state.user.route || '综合路线')}</h1>
        <div class="meta">
          <span>Lv.${state.user.level}</span>
          <span>${state.user.exp} EXP</span>
          <span>连续 ${state.user.streak} 天</span>
        </div>
        <div class="progress"><span style="width:${state.user.exp % 100}%"></span></div>
      </article>
      <section>
        <h2 class="section-title">已获得称号</h2>
        <div class="grid">${unlocked.length ? unlocked.map(titleCard).join('') : '<article class="card"><p class="muted">完成首次打卡即可获得第一个称号。</p></article>'}</div>
      </section>
      <section>
        <h2 class="section-title">待解锁称号</h2>
        <div class="grid">${locked.map(titleCard).join('')}</div>
      </section>
    </section>
  `;
}

function titleCard(title) {
  return `
    <article class="card tight">
      <div class="row">
        <strong>${escapeHtml(title.name)}</strong>
        <span class="badge">${title.unlocked ? '已解锁' : '待解锁'}</span>
      </div>
      <p class="muted">${escapeHtml(title.condition)}</p>
    </article>
  `;
}

function renderLeaderboard() {
  const leaderboards = getLeaderboards(state);
  const active = app.dataset.rankTab || 'persistence';
  const labels = { persistence: '坚持榜', progress: '进步榜', teams: '小队榜', newbie: '新人榜' };
  const entries = leaderboards[active];
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <h1 class="title">多维排行榜</h1>
        <p class="muted">不只看运动量，也看坚持、进步和小队贡献。</p>
      </article>
      <div class="option-row">
        ${Object.entries(labels).map(([key, label]) => `<button class="chip ${key === active ? 'active' : ''}" data-rank-tab="${key}">${label}</button>`).join('')}
      </div>
      <div class="stack">
        ${entries.map((entry) => `
          <article class="card rank-card">
            <div class="row">
              <div>
                <div class="rank-name">#${entry.rank} ${escapeHtml(entry.name)}</div>
                <p class="muted">${escapeHtml(entry.title || entry.type || '新手上路')}</p>
              </div>
              <span class="badge">${escapeHtml(entry.metric)}</span>
            </div>
            <button class="button danger" data-action="report" data-record-id="${entry.id}">举报异常</button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderProfile() {
  app.innerHTML = `
    <section class="shell">
      <article class="card">
        <h1 class="title">${escapeHtml(state.user.roleName || state.user.name)}</h1>
        <p class="muted">${escapeHtml(state.user.route || '综合路线')} · ${escapeHtml(state.user.title || '新手上路')}</p>
      </article>
      <article class="card stack">
        <div class="row">
          <div><strong>排行榜匿名展示</strong><p class="muted">开启后榜单显示“匿名用户”。</p></div>
          <button class="button ${state.user.anonymous ? '' : 'secondary'}" data-action="toggle-anonymous">${state.user.anonymous ? '已开启' : '开启'}</button>
        </div>
        <div class="row">
          <div><strong>公开详细运动数据</strong><p class="muted">默认关闭，只展示完成状态。</p></div>
          <button class="button ${state.user.shareDetails ? '' : 'secondary'}" data-action="toggle-share">${state.user.shareDetails ? '已开启' : '开启'}</button>
        </div>
      </article>
      <article class="card">
        <h2 class="section-title">举报记录</h2>
        ${state.reports.length ? state.reports.map((report) => `<p class="muted">${escapeHtml(report.reason)} · ${escapeHtml(report.status)}</p>`).join('') : '<p class="muted">暂无举报记录。</p>'}
      </article>
      <button class="button ghost" data-action="reset">重置演示数据</button>
    </section>
  `;
}

function render() {
  if (!state.user.onboarded && currentView !== 'onboarding') {
    currentView = 'onboarding';
  }
  const views = {
    onboarding: renderOnboarding,
    home: renderHome,
    tasks: renderTasks,
    team: renderTeam,
    invite: renderInvite,
    growth: renderGrowth,
    leaderboard: renderLeaderboard,
    profile: renderProfile
  };
  views[currentView]();
  updateTabs();
}

function selectedSports() {
  return Array.from(document.querySelectorAll('[data-sport].active')).map((button) => button.dataset.sport);
}

document.body.addEventListener('click', (event) => {
  const sportChip = event.target.closest('[data-sport]');
  if (sportChip) {
    const activeCount = selectedSports().length;
    if (!sportChip.classList.contains('active') && activeCount >= 3) {
      toast('最多选择 3 项');
      return;
    }
    sportChip.classList.toggle('active');
    return;
  }

  const tab = event.target.closest('[data-view]');
  if (tab && state.user.onboarded) {
    setView(tab.dataset.view);
    return;
  }

  const viewLink = event.target.closest('[data-view-link]');
  if (viewLink) {
    setView(viewLink.dataset.viewLink);
    return;
  }

  const rankTab = event.target.closest('[data-rank-tab]');
  if (rankTab) {
    app.dataset.rankTab = rankTab.dataset.rankTab;
    renderLeaderboard();
    return;
  }

  const action = event.target.closest('[data-action]');
  if (!action) return;

  try {
    if (action.dataset.action === 'quick-checkin') {
      const task = state.tasks.find((item) => item.status === 'not-started');
      if (!task) {
        toast('今日任务已完成');
        return;
      }
      persist(completeTask(state, task.id, { duration: task.value, sport: task.sport }));
      toast('打卡成功');
    }
    if (action.dataset.action === 'complete-task') {
      const task = state.tasks.find((item) => item.id === action.dataset.taskId);
      const duration = Number(prompt('请输入运动时长（分钟）', task.value));
      persist(completeTask(state, action.dataset.taskId, { duration, sport: task.sport }));
      toast('打卡成功');
    }
    if (action.dataset.action === 'adjust-task') {
      const reason = prompt('请输入调整理由', adjustmentReasons[0]) || adjustmentReasons[0];
      persist(adjustTask(state, action.dataset.taskId, reason));
      toast('已生成恢复任务');
    }
    if (action.dataset.action === 'go-invite') {
      setView('invite');
    }
    if (action.dataset.action === 'respond-invite') {
      persist(respondToInvite(state, action.dataset.inviteId));
      toast('已响应约练');
    }
    if (action.dataset.action === 'report') {
      const reason = prompt('举报原因', '数据异常') || '数据异常';
      persist(reportRecord(state, action.dataset.recordId, reason));
      toast('已提交举报');
    }
    if (action.dataset.action === 'toggle-anonymous') {
      persist(setAnonymousLeaderboard(state, !state.user.anonymous));
    }
    if (action.dataset.action === 'toggle-share') {
      persist(setShareDetails(state, !state.user.shareDetails));
    }
    if (action.dataset.action === 'reset' && confirm('确认重置演示数据？')) {
      state = resetState();
      currentView = 'onboarding';
      render();
    }
  } catch (error) {
    toast(error.message);
  }
});

document.body.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);

  try {
    if (form.dataset.form === 'onboarding') {
      persist(completeOnboarding(state, {
        roleName: data.get('roleName'),
        goal: data.get('goal'),
        sports: selectedSports(),
        frequency: data.get('frequency'),
        fitness: data.get('fitness')
      }));
      currentView = 'home';
      render();
      toast('今日任务已生成');
    }
    if (form.dataset.form === 'team') {
      persist(createTeam(state, {
        name: data.get('name'),
        type: data.get('type'),
        slogan: data.get('slogan')
      }));
      toast('小队已创建');
    }
    if (form.dataset.form === 'invite') {
      persist(createInvite(state, {
        sport: data.get('sport'),
        time: data.get('time'),
        visibility: data.get('visibility'),
        note: data.get('note')
      }));
      toast('约练已发布');
    }
  } catch (error) {
    toast(error.message);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'p' && state.user.onboarded) {
    currentView = 'profile';
    render();
  }
});

render();
