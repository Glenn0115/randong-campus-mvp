const { getState, setState } = require('../../utils/storage');
const { REPORT_REASONS } = require('../../utils/constants');
const { calculateLeaderboards, reportRecord } = require('../../utils/domain');

const TABS = [
  { key: 'persistence', label: '坚持榜' },
  { key: 'progress', label: '进步榜' },
  { key: 'teams', label: '小队榜' },
  { key: 'newbie', label: '新人榜' }
];

Page({
  data: {
    tabs: TABS,
    activeTab: 'persistence',
    entries: []
  },

  onShow() {
    this.load();
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.key });
    this.load();
  },

  normalizeEntries(items, tabKey) {
    if (tabKey === 'teams') {
      return items.map((team) => ({
        rank: team.rank,
        record_id: team.team_id,
        record_type: 'leaderboard',
        name: team.team_name,
        title: `${team.member_ids.length} 人 · ${team.team_type}`,
        metric: team.metric
      }));
    }
    return items.map((user) => ({
      rank: user.rank,
      record_id: user.record_id || user.user_id,
      record_type: user.record_id ? 'checkin' : 'leaderboard',
      name: user.nickname,
      title: user.title || '新手上路',
      metric: user.metric
    }));
  },

  load() {
    const leaderboards = calculateLeaderboards(getState());
    this.setData({
      entries: this.normalizeEntries(leaderboards[this.data.activeTab] || [], this.data.activeTab)
    });
  },

  report(event) {
    const { recordId, recordType } = event.currentTarget.dataset;
    wx.showActionSheet({
      itemList: REPORT_REASONS,
      success: (result) => {
        const state = reportRecord(getState(), {
          record_type: recordType,
          record_id: recordId,
          reason: REPORT_REASONS[result.tapIndex]
        });
        setState(state);
        wx.showToast({ title: '已提交举报', icon: 'success' });
        this.load();
      }
    });
  }
});
