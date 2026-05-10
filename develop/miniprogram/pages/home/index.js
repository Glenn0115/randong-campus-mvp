const { getState } = require('../../utils/storage');

const STATUS_LABELS = {
  not_started: '未开始',
  in_progress: '进行中',
  pending: '待提交',
  completed: '已完成',
  adjusted: '已调整',
  expired: '已过期',
  reviewing: '复核中'
};

Page({
  data: {
    ready: false,
    user: {},
    todayTasks: [],
    team: null,
    expPercent: 0,
    teamPercent: 0
  },

  onShow() {
    const state = getState();
    if (!state.user.onboarded) {
      wx.redirectTo({ url: '/pages/onboarding/index' });
      return;
    }

    const team = state.teams.find((item) => item.team_id === state.user.team_id) || null;
    const tasks = state.tasks.slice(0, 3).map((task) => ({
      ...task,
      status_label: STATUS_LABELS[task.status] || task.status
    }));

    this.setData({
      ready: true,
      user: state.user,
      todayTasks: tasks,
      team,
      expPercent: state.user.exp % 100,
      teamPercent: team ? Math.min(100, Math.round((team.weekly_minutes / team.weekly_target) * 100)) : 0
    });
  },

  quickCheckin() {
    const task = this.data.todayTasks.find((item) => item.status !== 'completed' && item.status !== 'adjusted');
    if (!task) {
      wx.showToast({ title: '今日任务已完成', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/checkin/index?taskId=${task.task_id}` });
  },

  goCheckin(event) {
    wx.navigateTo({ url: `/pages/checkin/index?taskId=${event.currentTarget.dataset.taskId}` });
  },

  goInvite() {
    wx.navigateTo({ url: '/pages/invite/index' });
  },

  goTasks() {
    wx.switchTab({ url: '/pages/tasks/index' });
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/index' });
  }
});
