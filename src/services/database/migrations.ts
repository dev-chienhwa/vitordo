import { db } from './config';
import { Task, TimelineStatus } from '@/types/task';
import { ErrorHandler } from '@/utils/error-handler';

export interface Migration {
  version: number;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

// Migration registry
const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial database schema',
    up: async () => {
      // Initial schema is handled by Dexie schema definition
      console.log('Initial database schema created');
    },
  },
  
  // Example future migration
  {
    version: 2,
    description: 'Add priority field to existing tasks',
    up: async () => {
      const tasks = await db.tasks.toArray();
      const updates = tasks.map(task => ({
        ...task,
        priority: task.priority || 1, // Default priority
      }));
      
      await db.tasks.clear();
      await db.tasks.bulkAdd(updates);
      console.log('Added priority field to existing tasks');
    },
    down: async () => {
      // Remove priority field (optional rollback)
      const tasks = await db.tasks.toArray();
      const updates = tasks.map(task => {
        const { priority, ...taskWithoutPriority } = task;
        return taskWithoutPriority as Task;
      });
      
      await db.tasks.clear();
      await db.tasks.bulkAdd(updates);
      console.log('Removed priority field from tasks');
    },
  },
];

// Migration manager
export class MigrationManager {
  private static readonly MIGRATION_KEY = 'db_migration_version';

  // Get current migration version
  public static async getCurrentVersion(): Promise<number> {
    try {
      const version = await db.settings.get(this.MIGRATION_KEY);
      return version?.value || 0;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'MigrationManager.getCurrentVersion');
      return 0;
    }
  }

  // Set migration version
  private static async setCurrentVersion(version: number): Promise<void> {
    try {
      await db.settings.put({ key: this.MIGRATION_KEY, value: version });
    } catch (error) {
      ErrorHandler.logError(error as Error, 'MigrationManager.setCurrentVersion');
      throw error;
    }
  }

  // Run pending migrations
  public static async runMigrations(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const pendingMigrations = migrations.filter(m => m.version > currentVersion);

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Running ${pendingMigrations.length} pending migrations...`);

      for (const migration of pendingMigrations) {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.up();
          await this.setCurrentVersion(migration.version);
          console.log(`Migration ${migration.version} completed successfully`);
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error);
          throw new Error(`Migration ${migration.version} failed: ${error}`);
        }
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      ErrorHandler.logError(error as Error, 'MigrationManager.runMigrations');
      throw error;
    }
  }

  // Rollback to specific version
  public static async rollbackTo(targetVersion: number): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      if (targetVersion >= currentVersion) {
        console.log('Target version is not lower than current version');
        return;
      }

      const rollbackMigrations = migrations
        .filter(m => m.version > targetVersion && m.version <= currentVersion)
        .sort((a, b) => b.version - a.version); // Reverse order for rollback

      console.log(`Rolling back ${rollbackMigrations.length} migrations...`);

      for (const migration of rollbackMigrations) {
        if (!migration.down) {
          throw new Error(`Migration ${migration.version} does not support rollback`);
        }

        console.log(`Rolling back migration ${migration.version}: ${migration.description}`);
        
        try {
          await migration.down();
          console.log(`Migration ${migration.version} rolled back successfully`);
        } catch (error) {
          console.error(`Rollback of migration ${migration.version} failed:`, error);
          throw new Error(`Rollback of migration ${migration.version} failed: ${error}`);
        }
      }

      await this.setCurrentVersion(targetVersion);
      console.log(`Rollback to version ${targetVersion} completed successfully`);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'MigrationManager.rollbackTo');
      throw error;
    }
  }

  // Get migration status
  public static async getMigrationStatus(): Promise<{
    currentVersion: number;
    latestVersion: number;
    pendingMigrations: number;
    appliedMigrations: Migration[];
    pendingMigrationsList: Migration[];
  }> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const latestVersion = Math.max(...migrations.map(m => m.version));
      const appliedMigrations = migrations.filter(m => m.version <= currentVersion);
      const pendingMigrationsList = migrations.filter(m => m.version > currentVersion);

      return {
        currentVersion,
        latestVersion,
        pendingMigrations: pendingMigrationsList.length,
        appliedMigrations,
        pendingMigrationsList,
      };
    } catch (error) {
      ErrorHandler.logError(error as Error, 'MigrationManager.getMigrationStatus');
      throw error;
    }
  }

  // Validate database integrity
  public static async validateIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if all required tables exist
      const tables = ['tasks', 'timelineEvents', 'settings', 'cache'];
      for (const tableName of tables) {
        try {
          await (db as any)[tableName].limit(1).toArray();
        } catch (error) {
          issues.push(`Table '${tableName}' is not accessible`);
        }
      }

      // Check data consistency
      const tasks = await db.tasks.toArray();
      const timelineEvents = await db.timelineEvents.toArray();

      // Validate task data
      for (const task of tasks) {
        if (!task.id || !task.title || !task.startTime || !task.endTime) {
          issues.push(`Task ${task.id} has missing required fields`);
        }

        if (task.startTime >= task.endTime) {
          issues.push(`Task ${task.id} has invalid time range`);
        }

        if (!Object.values(TimelineStatus).includes(task.status)) {
          issues.push(`Task ${task.id} has invalid status: ${task.status}`);
        }
      }

      // Validate timeline events
      for (const event of timelineEvents) {
        if (!event.id || !event.taskId || !event.timestamp) {
          issues.push(`Timeline event ${event.id} has missing required fields`);
        }

        // Check if referenced task exists
        const taskExists = tasks.some(task => task.id === event.taskId);
        if (!taskExists) {
          issues.push(`Timeline event ${event.id} references non-existent task ${event.taskId}`);
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
      };
    } catch (error) {
      ErrorHandler.logError(error as Error, 'MigrationManager.validateIntegrity');
      return {
        isValid: false,
        issues: [`Database validation failed: ${error}`],
      };
    }
  }
}