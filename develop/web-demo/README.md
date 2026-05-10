# 燃动校园 H5 Web Demo

这个目录提供不依赖微信开发者工具的浏览器演示版。

## 本地运行

直接用浏览器打开：

```text
develop/web-demo/index.html
```

也可以在仓库根目录启动一个静态服务：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/develop/web-demo/
```

## 测试

```bash
node develop/web-demo/web-demo.test.js
```

## 说明

- 数据存储在浏览器 `localStorage`。
- 页面覆盖新手引导、今日任务、任务调整、打卡、小队、约练、成长、排行榜、匿名展示和举报。
- 该版本用于演示 MVP 主流程；微信小程序源码仍保留在 `develop/miniprogram/`。
