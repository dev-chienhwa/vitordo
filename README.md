# Vitordo

Vitordo是一个智能任务管理和时间线可视化web应用。用户通过自然语言输入任务描述，系统利用LLM API自动进行任务拆解、时间估算和调度，并在右侧时间线中以不同颜色和状态展示任务进度。

## 功能特性

- 🤖 **智能任务解析**: 使用LLM API自动拆解和调度任务
- 📅 **可视化时间线**: 直观的任务进度和状态显示
- 🎨 **现代化界面**: 基于Tailwind CSS的响应式设计
- ⚡ **实时更新**: 任务状态实时同步和动画效果
- 💾 **数据持久化**: 本地存储确保数据不丢失

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + Framer Motion
- **状态管理**: Zustand
- **数据存储**: IndexedDB (Dexie.js)
- **LLM集成**: OpenAI API / Anthropic Claude API

## 开始使用

### 环境要求

- Node.js 18.17 或更高版本
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 在 `.env.local` 中配置你的API密钥：
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
src/
├── app/                    # Next.js App Router
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   ├── layout/           # 布局组件
│   └── features/         # 功能组件
├── services/             # 业务服务层
├── stores/               # 状态管理
├── types/                # TypeScript类型定义
├── utils/                # 工具函数
└── hooks/                # 自定义React Hooks
```

## 开发指南

### 代码规范

项目使用ESLint和Prettier进行代码格式化，Husky确保提交前的代码质量。

```bash
# 代码检查
npm run lint

# 代码格式化
npx prettier --write .
```

### 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
