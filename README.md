# WuyeBackstage

独立维护“后台管理网站”的仓库。

## 目标

- 只维护后台网页，不再和主工程混在一起
- 所有后台页面修改、构建、发布都在这个仓库完成
- 主工程仍然保留在 `C:\GmaeProJect\SXWY\Wuye\shengxing-property-core`

## 常用命令

```bash
npm install
npm run dev
npm run build
```

## 发布原则

- 修改后台网页后，先在本仓库完成构建
- 再使用 CloudBase CLI 或 CloudBase 发布流程同步到线上
- 提交 Git 时使用中文 commit message

## Git 部署说明

后台网页现在按 Git 仓库发版，不再手动用 CLI 发布静态站点。

标准流程：

1. 修改 `src/` 或其他源码文件
2. 本地执行 `npm run build`
3. 确认 `dist/` 产物已更新
4. 提交并推送到当前仓库
5. 由 CloudBase Git 部署自动拉取最新代码并发布到线上

部署路径当前为：

```text
/WuyeBackstage
```

如果未来要切到站点根路径，只需要同步修改 CloudBase 的部署路径配置。

## 安全要求

- 登录页只允许手动输入账号和密码
- 页面不展示默认口令
- 不要把测试密码写回 README、页面文案或提交说明里
