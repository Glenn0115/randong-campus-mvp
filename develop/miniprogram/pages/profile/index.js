const { getState, setState, resetState } = require('../../utils/storage');

Page({
  data: {
    user: {},
    anonymousLeaderboard: false,
    shareDetails: false,
    proof: {},
    reports: []
  },

  onShow() {
    this.load();
  },

  load() {
    const state = getState();
    this.setData({
      user: state.user,
      anonymousLeaderboard: state.user.privacy_setting.anonymous_leaderboard,
      shareDetails: state.user.privacy_setting.share_details,
      proof: state.user.proof_settings,
      reports: state.reports
    });
  },

  patchUser(patch) {
    const state = getState();
    setState({
      ...state,
      user: {
        ...state.user,
        ...patch
      }
    });
    this.load();
  },

  toggleAnonymous(event) {
    const state = getState();
    this.patchUser({
      privacy_setting: {
        ...state.user.privacy_setting,
        anonymous_leaderboard: event.detail.value
      }
    });
  },

  toggleShareDetails(event) {
    const state = getState();
    this.patchUser({
      privacy_setting: {
        ...state.user.privacy_setting,
        share_details: event.detail.value
      }
    });
  },

  toggleImageProof(event) {
    this.patchProof('image_enabled', event.detail.value);
  },

  toggleLocationProof(event) {
    this.patchProof('location_enabled', event.detail.value);
  },

  toggleHealthProof(event) {
    this.patchProof('health_data_enabled', event.detail.value);
  },

  patchProof(key, value) {
    const state = getState();
    this.patchUser({
      proof_settings: {
        ...state.user.proof_settings,
        [key]: value
      }
    });
  },

  resetDemo() {
    wx.showModal({
      title: '重置演示数据',
      content: '会清空本地打卡、小队和设置，回到首次进入状态。',
      success: (result) => {
        if (result.confirm) {
          resetState();
          wx.redirectTo({ url: '/pages/onboarding/index' });
        }
      }
    });
  }
});
