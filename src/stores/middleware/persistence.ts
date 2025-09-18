import { StateCreator } from 'zustand';

// Define PersistOptions interface since it might not be exported
interface PersistOptions<T> {
  name: string;
  storage?: {
    getItem: (name: string) => string | null | Promise<string | null>;
    setItem: (name: string, value: string) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
  };
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: () => (state?: T) => void;
}

// Simple persist implementation
const persist = <T>(options: PersistOptions<T>) => 
  (config: StateCreator<T>) => 
    (set: any, get: any, api: any) => {
      const state = config(set, get, api);
      
      // Load initial state from storage
      if (typeof window !== 'undefined' && options.storage) {
        try {
          const stored = options.storage.getItem(options.name);
          if (stored) {
            const parsedState = JSON.parse(stored as string);
            const partializedState = options.partialize ? options.partialize(parsedState) : parsedState;
            Object.assign(state, partializedState);
            
            if (options.onRehydrateStorage) {
              options.onRehydrateStorage()(state);
            }
          }
        } catch (error) {
          console.warn('Failed to load persisted state:', error);
        }
      }
      
      // Override set to persist changes
      const persistedSet = (partial: any, replace?: boolean) => {
        set(partial, replace);
        
        if (typeof window !== 'undefined' && options.storage) {
          try {
            const currentState = get();
            const stateToStore = options.partialize ? options.partialize(currentState) : currentState;
            options.storage.setItem(options.name, JSON.stringify(stateToStore));
          } catch (error) {
            console.warn('Failed to persist state:', error);
          }
        }
      };
      
      return config(persistedSet, get, api);
    };

// Generic persistence middleware configuration
export interface PersistConfig<T> {
  name: string;
  storage?: 'localStorage' | 'sessionStorage';
  partialize?: (state: T) => Partial<T>;
  onRehydrateStorage?: (state: T) => void;
}

// Custom storage implementation
const createStorage = (type: 'localStorage' | 'sessionStorage' = 'localStorage') => {
  const storage = type === 'localStorage' ? localStorage : sessionStorage;
  
  return {
    getItem: (name: string): string | null => {
      try {
        return storage.getItem(name);
      } catch (error) {
        console.warn(`Failed to get item from ${type}:`, error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        storage.setItem(name, value);
      } catch (error) {
        console.warn(`Failed to set item in ${type}:`, error);
      }
    },
    removeItem: (name: string): void => {
      try {
        storage.removeItem(name);
      } catch (error) {
        console.warn(`Failed to remove item from ${type}:`, error);
      }
    },
  };
};

// Create persistence middleware
export const createPersistenceMiddleware = <T>(
  config: PersistConfig<T>
) => {
  const persistOptions: PersistOptions<T> = {
    name: config.name,
    storage: createStorage(config.storage),
    partialize: config.partialize,
    onRehydrateStorage: () => (state) => {
      if (config.onRehydrateStorage && state) {
        config.onRehydrateStorage(state);
      }
    },
  };

  return persist<T>(persistOptions);
};

// Task store persistence configuration
export const taskStorePersistConfig: PersistConfig<any> = {
  name: 'vitordo-tasks',
  storage: 'localStorage',
  partialize: (state) => ({
    tasks: state.tasks,
    // Don't persist loading states or current input
  }),
  onRehydrateStorage: (state) => {
    // Convert date strings back to Date objects
    if (state?.tasks) {
      state.tasks = state.tasks.map((task: any) => ({
        ...task,
        startTime: new Date(task.startTime),
        endTime: new Date(task.endTime),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }));
    }
  },
};

// UI store persistence configuration
export const uiStorePersistConfig: PersistConfig<any> = {
  name: 'vitordo-ui',
  storage: 'localStorage',
  partialize: (state) => ({
    theme: state.theme,
    sidebarOpen: state.sidebarOpen,
    // Don't persist notifications or modal states
  }),
};

// Settings store persistence configuration
export const settingsStorePersistConfig: PersistConfig<any> = {
  name: 'vitordo-settings',
  storage: 'localStorage',
  partialize: (state) => state, // Persist all settings
};