# 燃动校园 MVP

「燃动校园」是一款面向大学生的游戏化运动激励微信小程序 MVP，通过今日任务、运动打卡、自由小队、简化约练、成长体系和多维排行榜提升运动频率与持续性。

## 项目结构

```text
prd/MVP_prd_.md              MVP 产品需求文档
develop/miniprogram/         微信小程序前端 MVP
develop/web-demo/            可直接用浏览器运行的 H5 演示版
index.html                   GitHub Pages / 本地浏览器入口
```

## 运行方式一：H5 Web Demo

不需要微信开发者工具，直接用浏览器打开：

网页访问：
已启用 GitHub Pages，并选择 `main` 分支根目录作为发布源，可直接访问：

```text
https://glenn0115.github.io/randong-campus-mvp/
```

项目安装到本地时，本地访问：
```text
develop/web-demo/index.html
```

也可以打开根目录 `index.html`，它会自动跳转到 H5 演示版。

## 运行方式二：微信小程序源码

1. 使用微信开发者工具打开 `develop/miniprogram`。
2. AppID 可使用测试号或游客模式。
3. 数据使用本地 storage 持久化，可在开发者工具中清除 storage 重置演示数据。

## 本地逻辑测试

```bash
node develop/miniprogram/tests/domain.test.js
node develop/web-demo/web-demo.test.js
```

## MVP 功能

- 新手引导与运动角色创建
- 今日任务、任务调整、手动打卡
- 运动路线、等级、称号
- 自由小队与共同任务
- 简化约练时间卡
- 坚持榜、进步榜、小队榜、新人榜
- 匿名展示、轻量举报、可选佐证占位
