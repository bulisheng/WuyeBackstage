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
