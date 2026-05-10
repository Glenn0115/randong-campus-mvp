const { getState, setState } = require('../../utils/storage');
const { TEAM_TYPES } = require('../../utils/constants');
const { createTeam, joinTeamByCode, createTasksForUser } = require('../../utils/domain');

function ensureTeamTask(state) {
  if (!state.user.team_id) {
    return state;
  }
  const exists = state.tasks.some((task) => task.task_type === 'social' && task.team_id === state.user.team_id);
  if (exists) {
    return state;
  }
  const socialTask = createTasksForUser(state.user, state.user.team_id).find((task) => task.task_type === 'social');
  return {
    ...state,
    tasks: [...state.tasks, socialTask]
  };
}

Page({
  data: {
    teamTypes: TEAM_TYPES,
    team: null,
    isCaptain: false,
    teamPercent: 0,
    teamInvites: [],
    teamName: '',
    teamType: '',
    slogan: '',
    inviteCode: ''
  },

  onShow() {
    this.load();
  },

  load() {
    const state = getState();
    const rawTeam = state.teams.find((item) => item.team_id === state.user.team_id) || null;
    const team = rawTeam
      ? {
          ...rawTeam,
          members: rawTeam.members.map((member) => ({
            ...member,
            initial: String(member.nickname || '同学').slice(0, 1)
          }))
        }
      : null;
    this.setData({
      team,
      isCaptain: !!team && team.captain_id === state.user.user_id,
      teamPercent: team ? Math.min(100, Math.round((team.weekly_minutes / team.weekly_target) * 100)) : 0,
      teamInvites: team ? state.workoutInvites.filter((invite) => invite.team_id === team.team_id || invite.visibility === 'team') : []
    });
  },

  onTeamNameInput(event) {
    this.setData({ teamName: event.detail.value });
  },

  onTeamTypeChange(event) {
    this.setData({ teamType: TEAM_TYPES[Number(event.detail.value)] });
  },

  onSloganInput(event) {
    this.setData({ slogan: event.detail.value });
  },

  onInviteCodeInput(event) {
    this.setData({ inviteCode: event.detail.value });
  },

  createTeam() {
    try {
      let state = createTeam(getState(), {
        team_name: this.data.teamName,
        team_type: this.data.teamType || '好友队',
        slogan: this.data.slogan
      });
      state = ensureTeamTask(state);
      setState(state);
      wx.showToast({ title: '小队已创建', icon: 'success' });
      this.load();
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  joinTeam() {
    try {
      let state = joinTeamByCode(getState(), this.data.inviteCode);
      state = ensureTeamTask(state);
      setState(state);
      wx.showToast({ title: '已加入小队', icon: 'success' });
      this.load();
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  goInvite() {
    wx.navigateTo({ url: '/pages/invite/index' });
  }
});
