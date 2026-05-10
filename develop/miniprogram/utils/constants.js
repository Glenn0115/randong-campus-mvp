const SPORT_OPTIONS = [
  { value: 'running', label: '跑步', route: '跑步路线' },
  { value: 'strength', label: '力量', route: '力量路线' },
  { value: 'ball', label: '球类', route: '球类路线' },
  { value: 'cycling', label: '骑行', route: '综合路线' },
  { value: 'stretching', label: '瑜伽/拉伸', route: '轻运动路线' },
  { value: 'walking', label: '散步', route: '轻运动路线' }
];

const GOAL_OPTIONS = [
  { value: 'fat_loss', label: '减脂' },
  { value: 'muscle_gain', label: '增肌' },
  { value: 'relax', label: '放松' },
  { value: 'fitness', label: '提升体能' },
  { value: 'social', label: '社交娱乐' }
];

const FREQUENCY_OPTIONS = [
  { value: 'low', label: '1-2 次' },
  { value: 'medium', label: '3-4 次' },
  { value: 'high', label: '5 次以上' }
];

const FITNESS_OPTIONS = [
  { value: 'newbie', label: '新手' },
  { value: 'normal', label: '一般' },
  { value: 'active', label: '较活跃' }
];

const TEAM_TYPES = [
  '宿舍队',
  '好友队',
  '班级队',
  '社团队',
  '其他'
];

const ADJUSTMENT_REASONS = [
  '考试/作业',
  '身体不适',
  '天气原因',
  '课程/活动冲突',
  '其他'
];

const REPORT_REASONS = [
  '数据异常',
  '截图疑似重复',
  '非本人运动',
  '其他'
];

const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PENDING: 'pending',
  COMPLETED: 'completed',
  ADJUSTED: 'adjusted',
  EXPIRED: 'expired'
};

const INVITE_STATUS = {
  RECRUITING: 'recruiting',
  ENDED: 'ended',
  CANCELLED: 'cancelled'
};

const VISIBILITY_OPTIONS = [
  { value: 'team', label: '好友/小队可见' },
  { value: 'campus', label: '校园广场可见' }
];

module.exports = {
  SPORT_OPTIONS,
  GOAL_OPTIONS,
  FREQUENCY_OPTIONS,
  FITNESS_OPTIONS,
  TEAM_TYPES,
  ADJUSTMENT_REASONS,
  REPORT_REASONS,
  TASK_STATUS,
  INVITE_STATUS,
  VISIBILITY_OPTIONS
};
