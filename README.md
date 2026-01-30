# 怡宿酒店预订系统 (Yisu Hotel)

基于 pnpm Monorepo 架构的智慧出行酒店预订系统，涵盖 PC 管理端、移动端小程序和后端服务。

## 📁 项目结构

```
XC_project/
├── packages/
│   ├── admin/        # PC 管理端
│   ├── mobile/       # 移动端（小程序/H5）
│   ├── server/       # 后端服务
│   └── shared/       # 共享代码（类型、工具、常量）
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## 🛠️ 技术栈

| 模块          | 技术栈                              |
| ------------- | ----------------------------------- |
| **PC 管理端** | React 18 + TypeScript + Vite        |
| **移动端**    | Taro + React 18 + TypeScript + Sass |
| **后端服务**  | Node.js + TypeScript                |
| **共享代码**  | TypeScript                          |
| **包管理**    | pnpm workspace                      |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
# 安装 pnpm（如未安装）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 启动开发服务

```bash
# 启动 PC 管理端
pnpm dev:admin

# 启动移动端 H5
pnpm dev:mobile

# 启动后端服务
pnpm dev:server
```

### 构建生产版本

```bash
# 构建 PC 管理端
pnpm build:admin

# 构建移动端 H5
pnpm build:mobile
```

## 📦 共享代码使用

在 `admin` 或 `mobile` 中引用共享代码：

```typescript
// 类型定义
import type { Hotel, Room, Order } from "@yisu/shared/types";

// 工具函数
import { formatPrice, formatDate } from "@yisu/shared/utils";

// 常量
import { ORDER_STATUS_MAP, STORAGE_KEYS } from "@yisu/shared/constants";
```

## 📝 License

MIT
