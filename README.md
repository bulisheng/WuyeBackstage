# 盛兴物业项目工作区

当前工作区保留一个独立主工程和两个参考工程：

```text
SXWY/
├─ shengxing-property/                    # 主开发工程：盛兴物业小程序
├─ WK-main/WK-main/                       # 参考工程：智慧物业模板
└─ drivermini-master/drivermini-master/   # 参考工程：物业缴费模板
```

## 开发入口

后续默认只在 `shengxing-property` 开发。

微信开发者工具打开：

```text
shengxing-property/project.config.json
```

目录规范：

```text
shengxing-property/docs/PROJECT_STRUCTURE.md
```

安装与初始化说明：

```text
shengxing-property/docs/INSTALL_GUIDE.md
```

## 保留原则

- `shengxing-property` 是主工程，承载首页、报修、缴费、投诉、商城、客服、后台和 CloudBase 云函数。
- 业主认证已调整为先审核后开通，未认证用户只能看到基础入口和认证提示。
- `WK-main/WK-main` 只作为智慧物业模板参考。
- `drivermini-master/drivermini-master` 只作为缴费模块参考。
- 后续新增功能先查 `docs/PROJECT_STRUCTURE.md`，按既定模块目录放置。
