# Vitordo Testing Guide

## Overview
This document describes the comprehensive testing strategy implemented for the Vitordo application.

## Test Structure

### 1. Unit Tests
Located in `src/**/__tests__/` directories alongside the source code.

#### Components Tests
- **Location**: `src/components/**/__tests__/`
- **Coverage**: 
  - `status-ring.test.tsx` - StatusRing component functionality
  - `input-component.test.tsx` - Input component behavior
  - `timeline.test.tsx` - Timeline component rendering
  - `button.test.tsx` - Button component variants

#### Services Tests
- **Location**: `src/services/__tests__/`
- **Coverage**:
  - `llmService.test.ts` - LLM API integration
  - `taskService.test.ts` - Task CRUD operations
  - `storageService.test.ts` - Data persistence
  - `cacheService.test.ts` - Caching mechanisms
  - `llmCacheService.test.ts` - LLM response caching

#### Hooks Tests
- **Location**: `src/hooks/__tests__/`
- **Coverage**:
  - `useTaskStatusUpdater.test.ts` - Task status management

#### Stores Tests
- **Location**: `src/stores/__tests__/`
- **Coverage**:
  - `taskStore.test.ts` - Task state management

### 2. Integration Tests
Located in `src/services/__tests__/integration.test.ts`

**Coverage**:
- Service layer interactions
- Data flow between services
- Error handling across services
- Cache integration with services

### 3. End-to-End Tests
Located in `e2e/` directory using Playwright.

**Coverage**:
- Complete user workflows
- Task creation and management
- Status updates and transitions
- Theme switching
- Error handling
- Responsive design
- Keyboard navigation

### 4. Test Utilities
Located in `src/test-utils/`

**Files**:
- `index.ts` - Test setup and utilities
- `mocks.ts` - Mock implementations for services

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests
```bash
npm run test
```

### Unit Tests with Coverage
```bash
npm run test:coverage
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

## Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Setup**: `jest.setup.js`
- **Environment**: jsdom for React components
- **Coverage Threshold**: 80% for all metrics

### Playwright Configuration
- **File**: `playwright.config.ts`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: Pixel 5, iPhone 12
- **Base URL**: http://localhost:3000

## Coverage Requirements

### Global Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Exclusions
- Type definition files (*.d.ts)
- Story files (*.stories.*)
- Index files (index.*)
- Next.js app directory files

## Test Categories

### 1. Component Testing
- **Rendering**: Components render without crashing
- **Props**: Props are handled correctly
- **Events**: User interactions work as expected
- **State**: Component state updates properly
- **Accessibility**: ARIA attributes and keyboard navigation

### 2. Service Testing
- **API Calls**: External API interactions
- **Data Transformation**: Input/output processing
- **Error Handling**: Network and API errors
- **Caching**: Cache hit/miss scenarios
- **Persistence**: Data storage and retrieval

### 3. Integration Testing
- **Service Interactions**: Services work together
- **Data Flow**: Data flows correctly through the app
- **State Management**: Store updates propagate
- **Error Propagation**: Errors are handled across layers

### 4. E2E Testing
- **User Workflows**: Complete user journeys
- **Cross-browser**: Functionality across browsers
- **Responsive**: Mobile and desktop layouts
- **Performance**: Page load and interaction times
- **Accessibility**: Screen reader compatibility

## Mock Strategy

### Service Mocks
- **LLM Service**: Mock AI responses
- **Storage Service**: Mock IndexedDB operations
- **Task Service**: Mock CRUD operations
- **Cache Service**: Mock cache operations

### API Mocks
- **Fetch**: Mock network requests
- **WebAPIs**: Mock browser APIs (localStorage, IndexedDB)
- **Timers**: Mock setTimeout/setInterval

## Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Test names explain what they test
3. **Single Responsibility**: One assertion per test when possible
4. **Test Behavior**: Test what the user sees/does
5. **Mock External Dependencies**: Isolate units under test

### Test Data
1. **Realistic Data**: Use data similar to production
2. **Edge Cases**: Test boundary conditions
3. **Error Scenarios**: Test failure paths
4. **Clean State**: Reset state between tests

### Performance
1. **Fast Tests**: Keep unit tests under 100ms
2. **Parallel Execution**: Run tests in parallel
3. **Selective Testing**: Run only affected tests during development
4. **Efficient Mocks**: Use lightweight mocks

## Continuous Integration

### Pre-commit Hooks
- **Lint**: ESLint checks
- **Format**: Prettier formatting
- **Type Check**: TypeScript compilation
- **Unit Tests**: Fast test suite

### CI Pipeline
1. **Install Dependencies**: npm ci
2. **Lint and Format**: Code quality checks
3. **Type Check**: TypeScript compilation
4. **Unit Tests**: Component and service tests
5. **Integration Tests**: Service interaction tests
6. **Build**: Production build verification
7. **E2E Tests**: Full application testing

## Debugging Tests

### Common Issues
1. **Async Operations**: Use waitFor for async updates
2. **Timer Issues**: Mock timers when needed
3. **DOM Cleanup**: Ensure proper cleanup between tests
4. **Mock Leakage**: Reset mocks between tests

### Debugging Tools
- **Jest Debug**: `node --inspect-brk node_modules/.bin/jest`
- **React DevTools**: For component inspection
- **Playwright Inspector**: For E2E test debugging
- **Coverage Reports**: Identify untested code

## Test Maintenance

### Regular Tasks
1. **Update Snapshots**: When UI changes intentionally
2. **Review Coverage**: Ensure coverage stays above thresholds
3. **Update Mocks**: Keep mocks in sync with real APIs
4. **Refactor Tests**: Keep tests maintainable

### Test Metrics
- **Coverage Percentage**: Track over time
- **Test Execution Time**: Monitor for performance
- **Flaky Tests**: Identify and fix unstable tests
- **Test Count**: Balance between coverage and maintenance

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

### Tools
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing
- **MSW**: API mocking for integration tests

This comprehensive testing strategy ensures high code quality, reliability, and maintainability of the Vitordo application.