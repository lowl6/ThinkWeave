# ThinkWeave（AI Co-Lab）

多 AI 人机协作研讨平台。当前 **v0.1.0** 的可运行界面是 FastAPI 托管的静态 HTML 原型（`frontend/public/`），默认使用 SQLite，无需单独安装数据库。

```
浏览器  ──►  FastAPI :8000
              ├── /           静态页面（首页、房间、6 种 ThinkLet）
              ├── /api/*      REST API（认证、房间、聊天、观点……）
              └── /ws         Socket.IO 实时通道
                    └── AI 网关（AiHubMix 或厂商直连）
```

> `frontend/src` 里的 React + Vite 工程仍在建设中，默认启动脚本**不会**对外提供这套 SPA。演示、联机、校园网访问请用下面的一键启动方式。

---

## 环境要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Windows 10/11（推荐）、Linux / macOS / WSL |
| Python | 3.10+（建议 3.11） |
| 端口 | `8000`（HTTP + WebSocket） |
| AI 能力 | 配置 `AI_GATEWAY_API_KEY` 后可用；不配也能注册、建房间、走流程 |
| 数据库 | 默认 SQLite，零配置；可选 MySQL |

不需要 PostgreSQL、Redis、Node.js 才能跑当前演示版本。

---

## 一、部署

### 1. Windows 一键启动（推荐）

在项目根目录打开 PowerShell：

```powershell
.\start.ps1
```

脚本会自动完成：

1. 若不存在根目录 `.env`，从 `backend/.env.example` 生成，并写入随机 JWT 密钥
2. 将 `.env` 复制到 `backend/.env`
3. 创建 `backend/.venv` 并安装 `backend/requirements.txt`
4. 以 `0.0.0.0:8000` 启动 uvicorn（本机 + 局域网均可访问）
5. 尝试放行 Windows 防火墙 TCP 8000
6. 轮询 `http://127.0.0.1:8000/api/health` 直到就绪

成功后终端会打印：

```
Open: http://localhost:8000
LAN : http://<本机无线网卡IPv4>:8000
Docs: http://<本机无线网卡IPv4>:8000/docs
```

停止服务：

```powershell
.\stop.ps1
```

若 8000 已被占用，先执行 `.\stop.ps1`，或结束占用该端口的进程后再启动。

### 2. Linux / macOS / WSL 一键启动

```bash
chmod +x start.sh
./start.sh
```

行为与 Windows 脚本对齐：SQLite + 后端托管静态页面，访问 `http://<本机IP>:8000`。

停止服务：

```bash
kill $(lsof -t -i:8000)
```

### 3. 手动启动（任意系统）

```bash
# 1. 环境变量
cp backend/.env.example .env          # 首次
cp .env backend/.env                  # 后端从工作目录读取 .env

# 2. 虚拟环境与依赖
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Unix:    source .venv/bin/activate
pip install -r requirements.txt

# 3. 启动（必须在 backend/ 目录下）
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

健康检查：`GET http://127.0.0.1:8000/api/health`  
应返回：`{"status":"ok","service":"ThinkWeave Backend"}`

### 4. 配置 AI（可选，但聊天/发散需要）

编辑项目根目录 `.env`（改完后重新执行启动脚本，或手动再复制到 `backend/.env`）：

```env
# 推荐：统一走 AiHubMix 网关
AI_GATEWAY_BASE_URL=https://aihubmix.com/v1
AI_GATEWAY_API_KEY=你的密钥

# 或按厂商直连（有厂商 Key 时优先走厂商，避免「厂商 URL + 网关 Key」混用）
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
```

未填写 Key 时，注册、登录、房间、流程页面仍可用，调用 AI 会失败。

### 5. 校园网 / 局域网访问

服务已监听 `0.0.0.0:8000`，同网段设备打开脚本打印的 `LAN` 地址即可。注意：

- 两台设备须在同一网段；部分校园网会开启 AP/客户端隔离，此时互相访问会失败
- Windows 需允许入站 TCP 8000（`start.ps1` 会尝试自动添加规则 `ThinkWeave-8000`）
- 脚本会优先取无线网卡 IPv4，并排除 VPN / 虚拟网卡

快速自测：本机用 `http://localhost:8000`，另一台设备用 `http://<无线IPv4>:8000`。

### 6. 切换数据库（可选）

默认：

```env
DATABASE_URL=sqlite+aiosqlite:///./thinkweave.db
```

数据文件位于 `backend/thinkweave.db`。首次启动会按模型自动建表。

改用 MySQL 时，在 `.env` 中改为：

```env
DATABASE_URL=mysql+asyncmy://root:password@localhost:3306/thinkweave
```

Windows 一键脚本若检测到 PostgreSQL/MySQL URL，会改回 SQLite，以保证本机零依赖可跑。生产环境请手动启动 uvicorn，不要走该脚本。

---

## 二、使用说明

浏览器打开 `http://localhost:8000`（根路径会跳转到 `首页.html`）。页面依赖 CDN 上的 Tailwind 与 Font Awesome，**需要能访问外网**才能正常显示样式。

### 1. 注册 / 登录

首次进入会弹出登录框：

| 字段 | 规则 |
|------|------|
| 用户名 | 2–50 字符，不可重复 |
| 昵称 | 注册时必填，1–100 字符 |
| 密码 | 至少 6 位 |

登录态保存在浏览器 `localStorage`（JWT）。会话默认 24 小时（`JWT_EXPIRE_MINUTES=1440`）。

### 2. 创建研讨房间

在首页或「创建高级房间」中：

1. 填写研讨主题（必填）
2. 可选房间密码（公开房间可不填）
3. 选择 AI 席位（DeepSeek / 文心 / 通义 / GPT-4 / Claude / Gemini / Kimi / GLM-4）
4. 设计流程：选用模板或自行增删环节
5. 创建后获得 **9 位房间号**，可发给其他人加入

内置流程模板：头脑风暴、深度分析、决策、创新。也可完全自定义。

### 3. 加入房间

在首页输入 **9 位数字房间号**（及密码，若有）加入。加入者须已登录。

### 4. 六个 ThinkLet 环节

创建房间时编排顺序，运行时按流程页左右导航切换。上一环节的观点可带到下一环节。

| ThinkLet | 页面 | 作用 |
|----------|------|------|
| FreeBrainstorm | 自由头脑风暴 | 人 + 多 AI 自由产出观点，写入灵感池 |
| LeafHopper | 思维跳跃 | 基于已有观点多轮跳跃发散 |
| FastFocus | 快速聚焦 | 对观点 Keep / Merge / Discard |
| BucketWalk | 水桶漫步 | 把观点归入分类桶 |
| PopcornSort | 米花拾掇 | 点选保留，AI 聚类、去重合并 |
| StrawPoll | 麦秆投票 | 分配点数投票，得到排序 |

另外还有「研讨时间轴」总览页，以及「付费页面」（套餐展示，权限校验尚未强制）。

### 5. 知识库附件

创建房间或研讨时可上传 `.txt` / `.md` / `.pdf` / `.docx` / `.json`，单文件不超过 10MB。服务端抽取文本后注入 AI 上下文。

### 6. 多人协作注意点

- 房间成员、流程进度会通过后端接口与房间状态同步
- WebSocket 挂在 `/ws`，用于成员进出等实时事件（认证仍有待完善）
- 同一浏览器多标签共享登录态；换设备需重新登录

---

## 三、接口速查

交互式文档：`http://localhost:8000/docs`

| 前缀 | 用途 |
|------|------|
| `POST /api/auth/register` `POST /api/auth/login` | 注册 / 登录 |
| `/api/rooms` | 房间 CRUD、加入、消息、房间状态 |
| `/api/chat` | 单模型 / 多模型聊天（可流式） |
| `/api/thinklets` | 环节开始/结束、观点搬运、各 ThinkLet 操作 |
| `/api/ideas` | 观点增改 |
| `/api/knowledge/extract` | 上传文件并抽文本 |
| `GET /api/health` | 健康检查 |
| `/ws` | Socket.IO |

调用业务接口时在请求头携带：

```
Authorization: Bearer <access_token>
```

---

## 四、目录结构（与当前代码一致）

```
ThinkWeave/
├── start.ps1 / stop.ps1 / start.sh   # 一键启停
├── backend/
│   ├── .env.example                  # 环境变量模板
│   ├── requirements.txt
│   ├── thinkweave.db                 # SQLite（运行后生成）
│   └── app/
│       ├── main.py                   # 入口：API + 静态页 + WS
│       ├── config.py / database.py
│       ├── api/                      # REST 路由
│       ├── models/ / schemas/
│       ├── services/thinklets/       # 6 种 ThinkLet
│       ├── services/ai/gateway.py    # 模型网关
│       └── realtime/                 # Socket.IO
└── frontend/
    ├── public/                       # ★ 当前对外 UI
    │   ├── 首页.html
    │   ├── 创建高级房间.html
    │   ├── 自由头脑风暴.html  …
    │   └── auth.js / storage.js / workflow-nav.js
    └── src/                          # React SPA（开发中，默认不托管）
```

---

## 五、React 前端开发模式（可选）

仅在改 `frontend/src` 时使用。该工程部分模块仍有 TODO，功能完整度低于静态原型。

```bash
# 终端 1：后端
cd backend && .venv/Scripts/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 终端 2：Vite
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

开发服务器在 `http://localhost:5173`，`/api` 与 `/ws` 已代理到 `8000`。

---

## 六、常见问题

**页面能开但样式乱 / 图标缺失**  
静态页从 CDN 拉 Tailwind 与 Font Awesome，检查本机是否能访问外网。

**注册返回 500，日志出现 `bcrypt` / `__about__`**  
`passlib` 与 bcrypt 5.x 不兼容。仓库已固定 `bcrypt==4.0.1`，请在 `backend/.venv` 中重新 `pip install -r backend/requirements.txt`。

**AI 不回复**  
检查 `backend/.env` 中 `AI_GATEWAY_API_KEY`（或对应厂商 Key）是否为空、是否复制到了 `backend/.env`。改完需重启服务。

**校园网另一台电脑打不开**  
确认用的是无线网卡 IPv4（不是 VPN）、防火墙已放行 8000、网络未开客户端隔离。用手机热点对照测试可快速判断是否为校园网隔离。

**改了 `frontend/src` 但页面没变化**  
一键启动托管的是 `frontend/public/`。要看 React 请走「React 前端开发模式」。

**Docker**  
仓库里有 `backend/Dockerfile` 与 `frontend/Dockerfile`，但缺少与当前「后端托管 HTML 原型」一致的 compose 编排，且后端镜像未打包 `frontend/public`。当前请用 Python 一键/手动启动，不要依赖 Docker。
