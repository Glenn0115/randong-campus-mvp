const { getState, setState } = require('../../utils/storage');
const { SPORT_OPTIONS } = require('../../utils/constants');
const { completeCheckIn } = require('../../utils/domain');

Page({
  data: {
    taskId: '',
    task: null,
    sportOptions: SPORT_OPTIONS,
    sportType: '',
    sportLabel: '',
    duration: '',
    distance: '',
    steps: '',
    note: '',
    imageEnabled: false,
    locationEnabled: false,
    healthEnabled: false
  },

  onLoad(query) {
    const state = getState();
    const task = state.tasks.find((item) => item.task_id === query.taskId) || null;
    const sportType = task ? task.sport_type : '';
    const sport = SPORT_OPTIONS.find((item) => item.value === sportType);
    this.setData({
      taskId: query.taskId || '',
      task,
      sportType,
      sportLabel: sport ? sport.label : ''
    });
  },

  onSportChange(event) {
    const sport = SPORT_OPTIONS[Number(event.detail.value)];
    this.setData({ sportType: sport.value, sportLabel: sport.label });
  },

  onDurationInput(event) {
    this.setData({ duration: event.detail.value });
  },

  onDistanceInput(event) {
    this.setData({ distance: event.detail.value });
  },

  onStepsInput(event) {
    this.setData({ steps: event.detail.value });
  },

  onNoteInput(event) {
    this.setData({ note: event.detail.value });
  },

  onImageToggle(event) {
    this.setData({ imageEnabled: event.detail.value });
  },

  onLocationToggle(event) {
    this.setData({ locationEnabled: event.detail.value });
  },

  onHealthToggle(event) {
    this.setData({ healthEnabled: event.detail.value });
  },

  submit() {
    if (!this.data.sportType) {
      wx.showToast({ title: '请选择运动类型', icon: 'none' });
      return;
    }
    if (!this.data.duration || Number(this.data.duration) <= 0) {
      wx.showToast({ title: '请输入有效时长', icon: 'none' });
      return;
    }

    const next = completeCheckIn(getState(), {
      task_id: this.data.taskId,
      sport_type: this.data.sportType,
      duration: Number(this.data.duration),
      distance: Number(this.data.distance || 0),
      steps: Number(this.data.steps || 0),
      note: this.data.note,
      image_enabled: this.data.imageEnabled,
      location_enabled: this.data.locationEnabled,
      health_data_enabled: this.data.healthEnabled
    });
    setState(next);

    wx.showToast({ title: '打卡成功', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/growth/index' });
    }, 500);
  }
});
