const { getState, setState } = require('../../utils/storage');

Page({
  data: {
    user: {},
    expPercent: 0,
    unlockedTitles: [],
    lockedTitles: []
  },

  onShow() {
    this.load();
  },

  load() {
    const state = getState();
    this.setData({
      user: state.user,
      expPercent: state.user.exp % 100,
      unlockedTitles: state.titles.filter((title) => title.unlocked),
      lockedTitles: state.titles.filter((title) => !title.unlocked)
    });
  },

  setDisplayTitle(event) {
    const titleName = event.currentTarget.dataset.titleName;
    const state = getState();
    setState({
      ...state,
      user: {
        ...state.user,
        display_title: titleName
      }
    });
    wx.showToast({ title: '已设置展示称号', icon: 'success' });
    this.load();
  }
});
