# 物业小程序项目使用说明

这是一个“微信小程序 + Spring Boot 后端 + MongoDB + Web 管理台”的完整项目。

## 一句话流程

1. 先启动 MongoDB
2. 再启动后端 `server`
3. 然后打开 Web 管理台 `web-admin`
4. 最后用微信开发者工具打开小程序联调

## 项目结构

- `pages/` - 微信小程序前端页面
- `server/` - Spring Boot 后端
- `web-admin/` - Vite + React Web 后台
- `docker-compose.yml` - 本地一键启动 MongoDB、Redis、后端和 Web 后台

## 1. 数据库怎么连接

后端默认连接 MongoDB：

```text
mongodb://localhost:27017/property_management
```

你有两种方式：

### 方式 A，本机直接装 MongoDB

1. 安装并启动 MongoDB Community Server
2. 确认 MongoDB 服务运行中
3. 保持默认连接串即可

### 方式 B，用 Docker Compose

在项目根目录执行：

```bash
docker compose up --build
```

这会启动：

- `mongo` - MongoDB
- `redis` - Redis
- `api` - Spring Boot 后端
- `web-admin` - Web 管理台

## 2. 后端怎么启动

### 本机启动

进入 `server/`：

```bash
cd server
mvn spring-boot:run
```

后端默认端口：

```text
http://127.0.0.1:8080
```

本机真机联调时，手机访问的不是 `127.0.0.1`，而是你电脑的局域网 IP，例如：

```text
http://192.168.5.4:8080
```

API 前缀：

```text
/api/v1
```

### 常用环境变量

- `SERVER_PORT` - 后端端口，默认 `8080`
- `MONGODB_URI` - MongoDB 连接串
- `OPENCLAW_BASE_URL` - openclaw 地址
- `ADMIN_API_KEY` - 管理员密钥，默认 `dev-admin-123456`
- `ADMIN_SESSION_TTL_MINUTES` - 管理员登录有效期，默认 `720`

### 真机联调建议

如果你要用手机真机调试，后端不要再只认 `127.0.0.1`，请改成你电脑在局域网里的 IP，例如：

```text
http://192.168.5.4:8080/api/v1
```

你可以先在 Windows 里查本机 IP：

```powershell
ipconfig
```

找到当前 Wi-Fi 或以太网的 `IPv4 地址`。

然后在微信开发者工具的控制台里执行：

```javascript
wx.setStorageSync('runtimeEnv', 'dev')
wx.setStorageSync('devApiBaseUrl', 'http://192.168.5.4:8080/api/v1')
```

这样小程序在真机上请求的就是你电脑对外可见的地址。

## 3. Web 后台怎么启动

Web 后台在 `web-admin/`，是独立的 Vite + React 项目。

### 本地开发

```bash
cd web-admin
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:5173
```

如果你用手机或其他设备访问，请改成你电脑的局域网 IP，例如：

```text
http://192.168.5.4:5173
```

### 生产构建

```bash
cd web-admin
npm install
npm run build
```

### 登录方式

1. 在 Web 后台输入 API 地址
2. 输入管理员密钥
3. 系统调用：

```text
POST /api/v1/admin/auth/login
```

4. 后端返回 token
5. 后续请求携带：

```text
Authorization: Bearer <token>
```

## 4. 微信小程序怎么打开

### 在微信开发者工具里导入

1. 打开微信开发者工具
2. 选择 `导入项目`
3. 项目目录选择：

```text
C:\Users\admin\WeChatProjects\miniprogram-1
```

4. AppID 使用你的小程序 AppID
5. 导入后直接编译

### 本地联调地址

小程序开发环境默认会读取本机配置。

如果你是在开发者工具模拟器里跑，可以继续用：

```text
http://127.0.0.1:8080/api/v1
```

如果你要用手机真机调试，把 `devApiBaseUrl` 改成你电脑局域网 IP 对应的地址，例如：

```text
http://192.168.5.4:8080/api/v1
```

### DevTools 设置

本地调试时，建议勾选：

```text
不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
```

## 5. 后台管理怎么用

Web 后台支持：

- 公告管理
- 账单管理
- 报修管理
- 搜索、筛选、排序、分页
- 详情抽屉可直接编辑
- 批量操作

### 访问顺序

1. 启动后端
2. 如果你要用手机访问 Web 后台，打开 `http://<你的电脑局域网IP>:5173`
3. 登录
4. 进入管理台操作数据

## 6. 常见接口

### 管理员登录

```http
POST /api/v1/admin/auth/login
```

请求体：

```json
{
  "adminKey": "dev-admin-123456"
}
```

### 公告列表

```http
GET /api/v1/admin/notices
```

### 账单列表

```http
GET /api/v1/admin/bills
```

### 报修列表

```http
GET /api/v1/admin/repairs
```

## 7. 推荐开发顺序

1. 先确认 MongoDB 能启动
2. 再确认 `server` 能跑起来
3. 再打开 `web-admin`
4. 最后在微信开发者工具里跑小程序

### 真机连通检查清单

1. 电脑和手机必须连同一个 Wi-Fi
2. 后端监听 `0.0.0.0:8080`
3. 小程序 `devApiBaseUrl` 设置成 `http://192.168.5.4:8080/api/v1`
4. Web 后台如果是 `npm run dev`，访问 `http://192.168.5.4:5173`
5. Web 后台如果是 `docker compose up --build`，访问 `http://192.168.5.4:3000`
6. 微信开发者工具里关闭域名校验，或至少在本地调试时允许 HTTP
7. Windows 防火墙不要拦截 `8080`、`5173` 和 `3000`

## 8. openclaw

`openclaw` 现在是一个辅助通道，不是业务数据源。

- 业务数据走你自己的后端和 MongoDB
- 智能整理、文本生成、分类建议才交给 `openclaw`

## 9. 如果你只想快速跑起来

最省事的方式是直接在项目根目录执行：

```bash
docker compose up --build
```

然后：

- 后端：`http://192.168.5.4:8080`
- Web 后台：`http://192.168.5.4:3000`
