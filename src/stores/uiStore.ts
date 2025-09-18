import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Notification } from '@/types/ui';
import { createPersistenceMiddleware, uiStorePersistConfig } from './middleware/persistence';

export interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // Modal states
  isTaskModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isConfirmModalOpen: boolean;
  confirmModalConfig: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null;
  
  // Loading states
  globalLoading: boolean;
  
  // Network status
  isOnline: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Modal actions
  openTaskModal: () => void;
  closeTaskModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openConfirmModal: (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
  closeConfirmModal: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  
  // Network actions
  setOnlineStatus: (online: boolean) => void;
}

// Helper function to generate notification ID
const generateNotificationId = (): string => {
  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    createPersistenceMiddleware(uiStorePersistConfig)(
      (set, get) => ({
    // Initial state
    theme: 'light',
    sidebarOpen: false,
    notifications: [],
    isTaskModalOpen: false,
    isSettingsModalOpen: false,
    isConfirmModalOpen: false,
    confirmModalConfig: null,
    globalLoading: false,
    isOnline: true,
    
    // Theme actions
    setTheme: (theme) => set({ theme }),
    
    toggleTheme: () => set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light'
    })),
    
    // Sidebar actions
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    
    toggleSidebar: () => set((state) => ({
      sidebarOpen: !state.sidebarOpen
    })),
    
    // Notification actions
    addNotification: (notificationData) => {
      const notification: Notification = {
        ...notificationData,
        id: generateNotificationId(),
        timestamp: new Date(),
      };
      
      set((state) => ({
        notifications: [...state.notifications, notification]
      }));
      
      // Auto-remove notification after duration
      if (notification.duration !== 0) {
        const duration = notification.duration || 5000;
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, duration);
      }
    },
    
    removeNotification: (id) => set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
    
    clearNotifications: () => set({ notifications: [] }),
    
    // Modal actions
    openTaskModal: () => set({ isTaskModalOpen: true }),
    closeTaskModal: () => set({ isTaskModalOpen: false }),
    
    openSettingsModal: () => set({ isSettingsModalOpen: true }),
    closeSettingsModal: () => set({ isSettingsModalOpen: false }),
    
    openConfirmModal: (config) => set({
      isConfirmModalOpen: true,
      confirmModalConfig: config
    }),
    
    closeConfirmModal: () => set({
      isConfirmModalOpen: false,
      confirmModalConfig: null
    }),
    
    // Loading actions
    setGlobalLoading: (loading) => set({ globalLoading: loading }),
    
    // Network actions
    setOnlineStatus: (online) => set({ isOnline: online }),
      })
    )
  )
);

// Selectors
export const selectTheme = (state: UIState) => state.theme;
export const selectSidebarOpen = (state: UIState) => state.sidebarOpen;
export const selectNotifications = (state: UIState) => state.notifications;
export const selectIsTaskModalOpen = (state: UIState) => state.isTaskModalOpen;
export const selectIsSettingsModalOpen = (state: UIState) => state.isSettingsModalOpen;
export const selectIsConfirmModalOpen = (state: UIState) => state.isConfirmModalOpen;
export const selectConfirmModalConfig = (state: UIState) => state.confirmModalConfig;
export const selectGlobalLoading = (state: UIState) => state.globalLoading;
export const selectIsOnline = (state: UIState) => state.isOnline;