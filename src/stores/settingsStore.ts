import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createPersistenceMiddleware, settingsStorePersistConfig } from './middleware/persistence';
import { LLMProvider } from '@/types/api';
import { TIME_CONFIG, UI_CONFIG } from '@/utils/constants';

export interface SettingsState {
  // LLM Configuration
  llmProvider: LLMProvider;
  llmSettings: {
    temperature: number;
    maxTokens: number;
    timeout: number;
  };
  
  // UI Preferences
  uiSettings: {
    animationsEnabled: boolean;
    soundEnabled: boolean;
    compactMode: boolean;
    showTimeEstimates: boolean;
    defaultTaskDuration: number;
  };
  
  // Time Configuration
  timeSettings: {
    workingHours: {
      start: number;
      end: number;
    };
    timeZone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
  };
  
  // Notification Settings
  notificationSettings: {
    enabled: boolean;
    taskReminders: boolean;
    statusUpdates: boolean;
    errorAlerts: boolean;
    duration: number;
  };
  
  // Actions
  setLLMProvider: (provider: LLMProvider) => void;
  updateLLMSettings: (settings: Partial<SettingsState['llmSettings']>) => void;
  updateUISettings: (settings: Partial<SettingsState['uiSettings']>) => void;
  updateTimeSettings: (settings: Partial<SettingsState['timeSettings']>) => void;
  updateNotificationSettings: (settings: Partial<SettingsState['notificationSettings']>) => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

// Default settings
const defaultSettings: Omit<SettingsState, 'setLLMProvider' | 'updateLLMSettings' | 'updateUISettings' | 'updateTimeSettings' | 'updateNotificationSettings' | 'resetToDefaults' | 'exportSettings' | 'importSettings'> = {
  llmProvider: {
    name: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: '',
  },
  llmSettings: {
    temperature: 0.7,
    maxTokens: 1000,
    timeout: 30000,
  },
  uiSettings: {
    animationsEnabled: true,
    soundEnabled: false,
    compactMode: false,
    showTimeEstimates: true,
    defaultTaskDuration: TIME_CONFIG.defaultTaskDuration,
  },
  timeSettings: {
    workingHours: TIME_CONFIG.workingHours,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '24h',
  },
  notificationSettings: {
    enabled: true,
    taskReminders: true,
    statusUpdates: true,
    errorAlerts: true,
    duration: UI_CONFIG.notificationDuration,
  },
};

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector(
    createPersistenceMiddleware(settingsStorePersistConfig)(
      (set, get) => ({
        ...defaultSettings,
        
        // Actions
        setLLMProvider: (provider) => set({ llmProvider: provider }),
        
        updateLLMSettings: (settings) => set((state) => ({
          llmSettings: { ...state.llmSettings, ...settings }
        })),
        
        updateUISettings: (settings) => set((state) => ({
          uiSettings: { ...state.uiSettings, ...settings }
        })),
        
        updateTimeSettings: (settings) => set((state) => ({
          timeSettings: { ...state.timeSettings, ...settings }
        })),
        
        updateNotificationSettings: (settings) => set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings }
        })),
        
        resetToDefaults: () => set(defaultSettings),
        
        exportSettings: () => {
          const state = get();
          const exportData = {
            llmProvider: state.llmProvider,
            llmSettings: state.llmSettings,
            uiSettings: state.uiSettings,
            timeSettings: state.timeSettings,
            notificationSettings: state.notificationSettings,
          };
          return JSON.stringify(exportData, null, 2);
        },
        
        importSettings: (settingsJson) => {
          try {
            const importedSettings = JSON.parse(settingsJson);
            
            // Validate imported settings structure
            if (typeof importedSettings !== 'object' || !importedSettings) {
              return false;
            }
            
            // Merge with current settings, keeping defaults for missing values
            const currentState = get();
            set({
              llmProvider: { ...currentState.llmProvider, ...importedSettings.llmProvider },
              llmSettings: { ...currentState.llmSettings, ...importedSettings.llmSettings },
              uiSettings: { ...currentState.uiSettings, ...importedSettings.uiSettings },
              timeSettings: { ...currentState.timeSettings, ...importedSettings.timeSettings },
              notificationSettings: { ...currentState.notificationSettings, ...importedSettings.notificationSettings },
            });
            
            return true;
          } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
          }
        },
      })
    )
  )
);

// Selectors
export const selectLLMProvider = (state: SettingsState) => state.llmProvider;
export const selectLLMSettings = (state: SettingsState) => state.llmSettings;
export const selectUISettings = (state: SettingsState) => state.uiSettings;
export const selectTimeSettings = (state: SettingsState) => state.timeSettings;
export const selectNotificationSettings = (state: SettingsState) => state.notificationSettings;