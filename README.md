# Yisu Hotel (易宿酒店) - 智慧出行酒店预订系统

欢迎来到 **Yisu Hotel** 项目！这是一个全栈式的酒店预订解决方案，涵盖了移动端用户体验、后台管理以及后端服务支持。

---

## 🏗️ 项目架构

本项目采用 Monorepo 风格的目录结构，统一在一个仓库中管理三个核心子项目：

| 目录 | 功能 | 技术栈 | 说明 |
| :--- | :--- | :--- | :--- |
| **`/mobile`** | 移动端应用 | [Taro](https://taro.zone/) + React + TypeScript | 编译为**微信小程序**。 |
| **`/admin`** | 管理后台 | [Vite](https://vitejs.dev/) + React + TypeScript | 用于酒店管理员管理房型、订单、用户等数据。 |
| **`/server`** | 后端服务 | Node.js + TypeScript + Express | 提供 RESTful API 接口，连接数据库。 |

---

## 🛠️ 环境准备

在开始之前，请确保您的开发环境已准备就绪：

1.  **Node.js**: 推荐安装最新 LTS 版本 (v18+)。
2.  **包管理器**: 本项目统一使用 **pnpm** 进行依赖管理。
    *   安装 pnpm: `npm install -g pnpm`
3.  **开发工具**:
    *   **微信开发者工具**: 必装，用于调试和预览微信小程序。

---

##  快速开始

### 1. 克隆项目 & 初始化
如果您是第一次下载本项目：
```bash
# 所有子项目的依赖安装（目前需分别进入各目录安装，并未配置 workspace）
cd mobile && pnpm install && cd ..
cd admin && pnpm install && cd ..
cd server && pnpm install && cd ..
```

### 2. 📱 移动端开发指南 (`/mobile`)

#### 启动开发服务器
```bash
cd mobile
pnpm dev:weapp
```
*此时，Taro 会启动编译监听模式，将代码实时编译到 `mobile/dist` 目录。*

#### 导入微信开发者工具
1.  打开 **微信开发者工具**。
2.  点击 **导入项目** (Import Project)。
3.  **目录**: 选择项目中的 `mobile` 文件夹 (注意**不是** `dist`)。
4.  **AppID**: 使用您的测试号或正式 AppID。
5.  **后端服务**: 选择“不使用云服务”。
6.  点击 **确定**。
7.  进入后，确保在详情设置中**关闭** ES6 转 ES5、样式补全等（交给 Taro 处理）。

### 3. 💻 管理后台开发指南 (`/admin`)

#### 启动开发服务器
```bash
cd admin
pnpm dev
# 访问 http://localhost:5173
```

### 4. ⚙️ 后端服务开发指南 (`/server`)

#### 启动开发服务器
```bash
cd server
pnpm dev
# 默认监听端口 (需在 index.ts 中确认)
```

---

## 📂 目录结构详解

```text
yisu-hotel/
├── mobile/                 # 移动端 (Taro)
│   ├── src/
│   │   ├── pages/          # 页面文件
│   │   ├── components/     # 通用组件
│   │   ├── app.config.ts   # 小程序全局配置
│   │   └── app.ts          # 入口文件
│   └── project.config.json # 微信开发者工具配置
│
├── admin/                  # 管理后台 (Vite)
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 路由页面
│   │   └── App.tsx         # 根组件
│   └── vite.config.ts      # Vite 配置
│
├── server/                 # 后端服务
│   ├── src/                # 源代码
│   │   └── index.ts        # 入口文件
│   └── tsconfig.json       # TS 配置
│
└── README.md               # 项目文档
```

---

## 🤝 贡献与规范

*   **代码风格**: 项目配置了 ESLint 和 Prettier，请确保编辑器开启自动格式化。
*   **Git 提交**: 参考文档https://xc0001.yuque.com/do304p/kcufua/zwm27awh9u4igr49。

如有任何问题，请查阅相关框架文档或联系项目负责人。
