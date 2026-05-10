const { getState, setState } = require('../../utils/storage');
const { ADJUSTMENT_REASONS, TASK_STATUS } = require('../../utils/constants');
const { adjustTask } = require('../../utils/domain');

const STATUS_LABELS = {
  not_started: '未开始',
  in_progress: '进行中',
  pending: '待提交',
  completed: '已完成',
  adjusted: '已调整',
  expired: '已过期',
  reviewing: '复核中'
};

const GROUPS = [
  { type: 'basic', label: '基础任务' },
  { type: 'preference', label: '偏好任务' },
  { type: 'social', label: '小队任务' },
  { type: 'recovery', label: '恢复任务' }
];

Page({
  data: {
    groups: [],
    remainingAdjustments: 68,
    maxAdjustments: 68
  },

  onShow() {
    this.load();
  },

  load() {
    const state = getState();
    const remaining = Math.max(0, state.adjustments.max_per_week - state.adjustments.current_week_count);
    const groups = GROUPS
      .map((group) => ({
        ...group,
        tasks: state.tasks
          .filter((task) => task.task_type === group.type)
          .map((task) => ({
            ...task,
            status_label: STATUS_LABELS[task.status] || task.status,
            can_adjust: remaining > 0 && task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.ADJUSTED
          }))
      }))
      .filter((group) => group.tasks.length > 0);

    this.setData({
      groups,
      remainingAdjustments: remaining,
      maxAdjustments: state.adjustments.max_per_week
    });
  },

  startTask(event) {
    const taskId = event.currentTarget.dataset.taskId;
    const state = getState();
    const tasks = state.tasks.map((task) => task.task_id === taskId ? { ...task, status: TASK_STATUS.IN_PROGRESS } : task);
    setState({ ...state, tasks });
    this.load();
  },

  adjustTask(event) {
    const taskId = event.currentTarget.dataset.taskId;
    wx.showActionSheet({
      itemList: ADJUSTMENT_REASONS,
      success: (result) => {
        try {
          const state = adjustTask(getState(), taskId, ADJUSTMENT_REASONS[result.tapIndex]);
          setState(state);
          wx.showToast({ title: '已生成恢复任务', icon: 'success' });
          this.load();
        } catch (error) {
          wx.showToast({ title: error.message, icon: 'none' });
        }
      }
    });
  },

  goCheckin(event) {
    wx.navigateTo({ url: `/pages/checkin/index?taskId=${event.currentTarget.dataset.taskId}` });
  }
});
