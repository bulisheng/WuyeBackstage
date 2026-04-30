# 盛兴物业工作区

这个仓库现在只保留主项目、过程文档和少量参考工程。

## 仓库结构

```text
Wuye/
├─ shengxing-property-core/      # 主工程：小程序、云函数、数据库、主业务文档
├─ docs/                         # 开发流程、阶段规划、交接说明
├─ WK-main/                      # 参考工程：智慧物业模板
├─ drivermini-master/            # 参考工程：物业缴费模板
└─ WuyeBackstage/                # 独立后台仓库，单独维护后台网站
```

## 当前约定

- 主开发默认在 `shengxing-property-core`
- 后台网页默认在 `WuyeBackstage`
- 旧的 `shengxing-property` 重复工程已清理
- 后台相关代码不再放回 `Wuye` 主仓库

## 开发入口

- 主项目微信开发者工具入口：
  - `shengxing-property-core/project.config.json`
- 后台仓库入口：
  - `WuyeBackstage/package.json`

## 文档入口

请先看：

1. `docs/README.md`
2. `shengxing-property-core/docs/00-总览.md`
3. `shengxing-property-core/docs/AI理解文档.md`

## 提交规则

- 每次改后台或数据库，都先同步 CloudBase
- 每次完成一个可验证小步就提交 Git
- Git 提交信息使用中文
