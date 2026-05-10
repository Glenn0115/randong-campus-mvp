const { getState, setState } = require('../../utils/storage');
const { GOAL_OPTIONS, SPORT_OPTIONS, FREQUENCY_OPTIONS, FITNESS_OPTIONS } = require('../../utils/constants');
const { createTasksForUser, routeForSport, todayKey } = require('../../utils/domain');

Page({
  data: {
    roleName: '',
    goalOptions: GOAL_OPTIONS,
    sportOptions: SPORT_OPTIONS,
    frequencyOptions: FREQUENCY_OPTIONS,
    fitnessOptions: FITNESS_OPTIONS,
    selectedGoal: '',
    selectedSports: [],
    selectedSportsMap: {},
    selectedFrequency: '',
    selectedFitness: ''
  },

  onLoad() {
    const state = getState();
    this.setData({
      roleName: state.user.role_name || '',
      selectedGoal: state.user.sport_goal || '',
      selectedSports: state.user.sport_preferences || [],
      selectedSportsMap: this.toMap(state.user.sport_preferences || []),
      selectedFrequency: state.user.frequency_level || '',
      selectedFitness: state.user.fitness_level || ''
    });
  },

  toMap(values) {
    return values.reduce((map, value) => {
      map[value] = true;
      return map;
    }, {});
  },

  onRoleNameInput(event) {
    this.setData({ roleName: event.detail.value });
  },

  chooseGoal(event) {
    this.setData({ selectedGoal: event.currentTarget.dataset.value });
  },

  toggleSport(event) {
    const value = event.currentTarget.dataset.value;
    const selected = [...this.data.selectedSports];
    const index = selected.indexOf(value);
    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      if (selected.length >= 3) {
        wx.showToast({ title: '最多选择 3 项', icon: 'none' });
        return;
      }
      selected.push(value);
    }
    this.setData({
      selectedSports: selected,
      selectedSportsMap: this.toMap(selected)
    });
  },

  chooseFrequency(event) {
    this.setData({ selectedFrequency: event.currentTarget.dataset.value });
  },

  chooseFitness(event) {
    this.setData({ selectedFitness: event.currentTarget.dataset.value });
  },

  validate() {
    const roleName = this.data.roleName.trim();
    if (roleName.length < 2 || roleName.length > 12) {
      return '角色名称需为 2-12 字';
    }
    if (!this.data.selectedGoal) {
      return '请选择运动目标';
    }
    if (this.data.selectedSports.length < 1) {
      return '至少选择 1 个运动偏好';
    }
    if (!this.data.selectedFrequency) {
      return '请选择每周运动频率';
    }
    if (!this.data.selectedFitness) {
      return '请选择当前运动基础';
    }
    return '';
  },

  submit() {
    const error = this.validate();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }

    const state = getState();
    const user = {
      ...state.user,
      role_name: this.data.roleName.trim(),
      sport_goal: this.data.selectedGoal,
      sport_preferences: this.data.selectedSports,
      frequency_level: this.data.selectedFrequency,
      fitness_level: this.data.selectedFitness,
      main_route: routeForSport(this.data.selectedSports[0]),
      onboarded: true
    };
    const tasks = createTasksForUser(user, user.team_id);
    setState({
      ...state,
      user,
      tasks,
      last_generated_date: todayKey()
    });
    wx.switchTab({ url: '/pages/home/index' });
  }
});
