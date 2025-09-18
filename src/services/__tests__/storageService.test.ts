import { StorageService } from '../storageService';
import { Task, TimelineStatus } from '@/types/task';

// Mock Dexie
jest.mock('dexie', () => {
  const mockDB = {
    tasks: {
      put: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
        between: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      update: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      count: jest.fn(),
      bulkAdd: jest.fn(),
    },
    timelineEvents: {
      put: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
          delete: jest.fn(),
        })),
      })),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      clear: jest.fn(),
      count: jest.fn(),
      bulkAdd: jest.fn(),
    },
    settings: {
      put: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(),
      clear: jest.fn(),
      bulkAdd: jest.fn(),
    },
    cache: {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      where: jest.fn(() => ({
        below: jest.fn(() => ({
          delete: jest.fn(),
        })),
      })),
      count: jest.fn(),
    },
    transaction: jest.fn((mode, tables, callback) => callback()),
    open: jest.fn(),
    close: jest.fn(),
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockDB),
    Dexie: jest.fn(() => mockDB),
  };
});

// Mock database config
jest.mock('../database/config', () => ({
  db: {
    tasks: {
      put: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
        })),
        between: jest.fn(() => ({
          toArray: jest.fn(),
        })),
      })),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      update: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      count: jest.fn(),
      bulkAdd: jest.fn(),
    },
    timelineEvents: {
      put: jest.fn(),
      toArray: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          toArray: jest.fn(),
          delete: jest.fn(),
        })),
      })),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      clear: jest.fn(),
      count: jest.fn(),
      bulkAdd: jest.fn(),
    },
    settings: {
      put: jest.fn(),
      get: jest.fn(),
      toArray: jest.fn(),
      clear: jest.fn(),
      bulkAdd: jest.fn(),
    },
    cache: {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      where: jest.fn(() => ({
        below: jest.fn(() => ({
          delete: jest.fn(),
        })),
      })),
      count: jest.fn(),
    },
    transaction: jest.fn((mode, tables, callback) => callback()),
    open: jest.fn(),
    close: jest.fn(),
  },
  initializeDatabase: jest.fn(() => Promise.resolve(true)),
  checkDatabaseHealth: jest.fn(() => Promise.resolve({
    isHealthy: true,
    stats: {
      tasksCount: 0,
      eventsCount: 0,
      cacheCount: 0,
      storageUsed: 0,
    },
  })),
}));

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = StorageService.getInstance();
    jest.clearAllMocks();
  });

  describe('Task Operations', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      startTime: new Date('2023-01-01T10:00:00Z'),
      endTime: new Date('2023-01-01T11:00:00Z'),
      status: TimelineStatus.UPCOMING,
      priority: 1,
      createdAt: new Date('2023-01-01T09:00:00Z'),
      updatedAt: new Date('2023-01-01T09:00:00Z'),
    };

    it('should save a task', async () => {
      await storageService.saveTask(mockTask);
      
      const { db } = require('../database/config');
      expect(db.tasks.put).toHaveBeenCalledWith(mockTask);
    });

    it('should load tasks', async () => {
      const { db } = require('../database/config');
      db.tasks.orderBy.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockTask]),
      });

      const tasks = await storageService.loadTasks();
      
      expect(db.tasks.orderBy).toHaveBeenCalledWith('startTime');
      expect(tasks).toEqual([mockTask]);
    });

    it('should get task by id', async () => {
      const { db } = require('../database/config');
      db.tasks.get.mockResolvedValue(mockTask);

      const task = await storageService.getTaskById('1');
      
      expect(db.tasks.get).toHaveBeenCalledWith('1');
      expect(task).toEqual(mockTask);
    });

    it('should update a task', async () => {
      const updates = { title: 'Updated Title' };
      
      await storageService.updateTask('1', updates);
      
      const { db } = require('../database/config');
      expect(db.tasks.update).toHaveBeenCalledWith('1', updates);
    });

    it('should delete a task', async () => {
      await storageService.deleteTask('1');
      
      const { db } = require('../database/config');
      expect(db.transaction).toHaveBeenCalled();
      expect(db.tasks.delete).toHaveBeenCalledWith('1');
    });

    it('should get tasks by status', async () => {
      const { db } = require('../database/config');
      db.tasks.where.mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockTask]),
        }),
      });

      const tasks = await storageService.getTasksByStatus(TimelineStatus.UPCOMING);
      
      expect(db.tasks.where).toHaveBeenCalledWith('status');
      expect(tasks).toEqual([mockTask]);
    });
  });

  describe('Settings Operations', () => {
    it('should save a setting', async () => {
      await storageService.saveSetting('theme', 'dark');
      
      const { db } = require('../database/config');
      expect(db.settings.put).toHaveBeenCalledWith({ key: 'theme', value: 'dark' });
    });

    it('should get a setting', async () => {
      const { db } = require('../database/config');
      db.settings.get.mockResolvedValue({ key: 'theme', value: 'dark' });

      const value = await storageService.getSetting('theme');
      
      expect(db.settings.get).toHaveBeenCalledWith('theme');
      expect(value).toBe('dark');
    });

    it('should get all settings', async () => {
      const { db } = require('../database/config');
      db.settings.toArray.mockResolvedValue([
        { key: 'theme', value: 'dark' },
        { key: 'language', value: 'en' },
      ]);

      const settings = await storageService.getAllSettings();
      
      expect(settings).toEqual({
        theme: 'dark',
        language: 'en',
      });
    });
  });

  describe('Cache Operations', () => {
    it('should set cache with TTL', async () => {
      const value = { data: 'test' };
      
      await storageService.setCache('test-key', value, 30);
      
      const { db } = require('../database/config');
      expect(db.cache.put).toHaveBeenCalledWith({
        key: 'test-key',
        value,
        expiresAt: expect.any(Date),
      });
    });

    it('should get cache value', async () => {
      const { db } = require('../database/config');
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      db.cache.get.mockResolvedValue({
        key: 'test-key',
        value: { data: 'test' },
        expiresAt: futureDate,
      });

      const value = await storageService.getCache('test-key');
      
      expect(value).toEqual({ data: 'test' });
    });

    it('should return undefined for expired cache', async () => {
      const { db } = require('../database/config');
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      db.cache.get.mockResolvedValue({
        key: 'test-key',
        value: { data: 'test' },
        expiresAt: pastDate,
      });

      const value = await storageService.getCache('test-key');
      
      expect(value).toBeUndefined();
      expect(db.cache.delete).toHaveBeenCalledWith('test-key');
    });
  });

  describe('Storage Statistics', () => {
    it('should get storage stats', async () => {
      const stats = await storageService.getStorageStats();
      
      expect(stats).toEqual({
        tasksCount: 0,
        eventsCount: 0,
        storageUsed: 0,
        isHealthy: true,
      });
    });
  });
});