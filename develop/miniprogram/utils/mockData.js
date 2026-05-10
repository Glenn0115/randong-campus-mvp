const { TASK_STATUS } = require('./constants');

function createSeedState() {
  const now = new Date().toISOString();

  return {
    user: {
      user_id: 'u_current',
      nickname: '校园同学',
      avatar: '',
      school_id: 'school_demo',
      role_name: '',
      sport_goal: '',
      sport_preferences: [],
      frequency_level: '',
      fitness_level: '',
      main_route: '',
      level: 1,
      exp: 0,
      streak_days: 0,
      privacy_setting: {
        anonymous_leaderboard: false,
        share_details: false
      },
      onboarded: false,
      display_title: '',
      team_id: '',
      created_at: now,
      proof_settings: {
        image_enabled: false,
        location_enabled: false,
        health_data_enabled: false
      }
    },
    tasks: [],
    checkIns: [],
    teams: [
      {
        team_id: 'team_seed',
        team_name: '操场慢跑队',
        team_type: '好友队',
        captain_id: 'u_seed_1',
        member_ids: ['u_seed_1', 'u_seed_2', 'u_seed_3'],
        members: [
          { user_id: 'u_seed_1', nickname: '阿航', title: '操场常客' },
          { user_id: 'u_seed_2', nickname: '小林', title: '晨跑新星' },
          { user_id: 'u_seed_3', nickname: '可可', title: '坚持达人' }
        ],
        invite_code: 'RUN2026',
        slogan: '今晚也去操场走一圈',
        weekly_minutes: 180,
        weekly_target: 600,
        today_checkins: 1,
        created_at: now
      }
    ],
    workoutInvites: [],
    reports: [],
    titles: [
      {
        title_id: 'first_checkin',
        name: '新手上路',
        condition: '完成首次打卡',
        rarity: '基础',
        unlocked: false
      },
      {
        title_id: 'morning_runner',
        name: '晨跑新星',
        condition: '早晨完成 3 次跑步任务',
        rarity: '进阶',
        unlocked: false
      },
      {
        title_id: 'playground_regular',
        name: '操场常客',
        condition: '累计完成 10 次运动任务',
        rarity: '进阶',
        unlocked: false
      },
      {
        title_id: 'team_engine',
        name: '小队发动机',
        condition: '发起 3 次约练并有人响应',
        rarity: '团队',
        unlocked: false
      },
      {
        title_id: 'persistence_7',
        name: '坚持达人',
        condition: '连续完成 7 天任务',
        rarity: '稀有',
        unlocked: false
      }
    ],
    adjustments: {
      week_key: '',
      current_week_count: 0,
      max_per_week: 68
    },
    seedRankings: {
      users: [
        {
          user_id: 'u_seed_1',
          nickname: '阿航',
          avatar: '',
          title: '操场常客',
          streak_days: 9,
          task_count: 18,
          this_week_minutes: 260,
          last_week_minutes: 180,
          created_at: now
        },
        {
          user_id: 'u_seed_2',
          nickname: '小林',
          avatar: '',
          title: '晨跑新星',
          streak_days: 6,
          task_count: 11,
          this_week_minutes: 160,
          last_week_minutes: 80,
          created_at: now
        }
      ]
    },
    last_generated_date: ''
  };
}

function createDefaultTasksForPreview() {
  return [
    {
      task_id: 'preview_basic',
      task_type: 'basic',
      title: '散步 20 分钟',
      description: '从低门槛开始，先让身体动起来。',
      sport_type: 'walking',
      target_value: 20,
      target_unit: '分钟',
      exp_reward: 30,
      status: TASK_STATUS.NOT_STARTED,
      adjusted: false,
      created_at: new Date().toISOString(),
      expired_at: ''
    }
  ];
}

module.exports = {
  createSeedState,
  createDefaultTasksForPreview
};
