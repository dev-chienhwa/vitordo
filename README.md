# Vitordo - AI-Powered Task Management

Vitordo is an intelligent task management application that transforms natural language input into organized, scheduled tasks using AI-powered assistance.

## Features

- **Natural Language Processing**: Describe tasks in plain English
- **Smart Scheduling**: AI-powered task scheduling and conflict detection
- **Multiple AI Providers**: OpenAI, Anthropic, and DeepSeek Reasoner support
- **Three-State Timeline**: Visual task status management (Upcoming, Recently Completed, Completed)
- **Offline Support**: Works offline with automatic sync
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Customizable appearance
- **Performance Optimized**: Virtual scrolling, caching, and lazy loading

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vitordo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vitordo/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── features/        # Feature-specific components
│   │   ├── layout/          # Layout components
│   │   ├── providers/       # Context providers
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Business logic and API services
│   ├── stores/              # State management (Zustand)
│   ├── utils/               # Utility functions
│   └── __tests__/           # Test files
├── docs/                    # Documentation
├── e2e/                     # End-to-end tests
└── public/                  # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Testing

### Unit Tests
```bash
npm run test
```

### End-to-End Tests
```bash
npm run e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## Documentation

- [User Guide](./docs/USER_GUIDE.md) - How to use Vitordo
- [API Documentation](./docs/API.md) - Developer API reference
- [Component Documentation](./docs/COMPONENTS.md) - Component library reference
- [DeepSeek Integration](./docs/DEEPSEEK_INTEGRATION.md) - DeepSeek Reasoner setup and usage

## Architecture

### Core Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Zustand** - State management
- **IndexedDB** - Local data persistence

### Key Services

- **LLM Service** - Natural language processing (OpenAI, Anthropic, DeepSeek)
- **Task Service** - Task CRUD operations
- **Storage Service** - Data persistence
- **Cache Service** - Performance optimization

### State Management

The application uses Zustand for state management with the following stores:

- **Task Store** - Task data and operations
- **UI Store** - UI state and notifications
- **Settings Store** - User preferences and configuration

## Performance Features

- **Virtual Scrolling** - Efficient rendering of large task lists
- **Intelligent Caching** - LLM response caching with TTL
- **Lazy Loading** - Components loaded on demand
- **Debounced Inputs** - Optimized user input handling
- **Offline Support** - Local storage with sync capabilities

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript best practices
- Use semantic commit messages
- Ensure accessibility compliance
- Maintain documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please check the [User Guide](./docs/USER_GUIDE.md) or open an issue on GitHub.

## Roadmap

- [ ] Voice input support
- [ ] Team collaboration features
- [ ] Calendar integrations
- [ ] Mobile app
- [ ] API for third-party integrations
- [ ] Advanced analytics and reporting