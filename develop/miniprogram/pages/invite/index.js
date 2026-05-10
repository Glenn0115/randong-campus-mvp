const { getState, setState } = require('../../utils/storage');
const { SPORT_OPTIONS, VISIBILITY_OPTIONS } = require('../../utils/constants');
const { createWorkoutInvite, respondToInvite } = require('../../utils/domain');

Page({
  data: {
    sportOptions: SPORT_OPTIONS,
    visibilityOptions: VISIBILITY_OPTIONS,
    sportType: '',
    sportLabel: '',
    workoutTime: '',
    visibility: 'team',
    visibilityLabel: '好友/小队可见',
    note: '',
    visibleInvites: []
  },

  onShow() {
    this.loadInvites();
  },

  onSportChange(event) {
    const sport = SPORT_OPTIONS[Number(event.detail.value)];
    this.setData({ sportType: sport.value, sportLabel: sport.label });
  },

  onWorkoutTimeInput(event) {
    this.setData({ workoutTime: event.detail.value });
  },

  onVisibilityChange(event) {
    const option = VISIBILITY_OPTIONS[Number(event.detail.value)];
    this.setData({ visibility: option.value, visibilityLabel: option.label });
  },

  onNoteInput(event) {
    this.setData({ note: event.detail.value });
  },

  loadInvites() {
    const state = getState();
    const visibleInvites = state.workoutInvites
      .filter((invite) => invite.visibility === 'campus' || invite.team_id === state.user.team_id || invite.creator_id === state.user.user_id)
      .map((invite) => ({
        ...invite,
        visibility_label: invite.visibility === 'campus' ? '校园广场' : '小队可见',
        responded: invite.responder_ids.includes(state.user.user_id)
      }));
    this.setData({ visibleInvites });
  },

  createInvite() {
    try {
      const state = createWorkoutInvite(getState(), {
        sport_type: this.data.sportType,
        workout_time: this.data.workoutTime,
        visibility: this.data.visibility,
        note: this.data.note
      });
      setState(state);
      wx.showToast({ title: '约练已发布', icon: 'success' });
      this.setData({ workoutTime: '', note: '' });
      this.loadInvites();
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  respond(event) {
    try {
      const state = respondToInvite(getState(), event.currentTarget.dataset.inviteId);
      setState(state);
      wx.showToast({ title: '已响应', icon: 'success' });
      this.loadInvites();
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' });
    }
  }
});
