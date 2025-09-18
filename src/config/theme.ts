// Theme configuration for the application

export interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface TimelineColors {
  upcoming: string;
  upcomingBg: string;
  recent: string;
  recentBg: string;
  completed: string;
  completedBg: string;
}

export interface StatusColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  timeline: TimelineColors;
  status: StatusColors;
  radius: string;
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#ffffff',
    foreground: '#171717',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e2e8f0',
    input: '#ffffff',
    ring: '#3b82f6',
  },
  timeline: {
    upcoming: '#e2e8f0',
    upcomingBg: '#ffffff',
    recent: '#10b981',
    recentBg: '#10b981',
    completed: '#374151',
    completedBg: '#374151',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  radius: '0.5rem',
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#0a0a0a',
    foreground: '#ededed',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#1e293b',
    secondaryForeground: '#f8fafc',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#1e293b',
    accentForeground: '#f8fafc',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#334155',
    input: '#1e293b',
    ring: '#3b82f6',
  },
  timeline: {
    upcoming: '#475569',
    upcomingBg: '#1e293b',
    recent: '#10b981',
    recentBg: '#10b981',
    completed: '#6b7280',
    completedBg: '#6b7280',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  radius: '0.5rem',
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themes;

// Utility functions for theme management
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Apply timeline colors
  Object.entries(theme.timeline).forEach(([key, value]) => {
    const cssVar = `--timeline-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Apply status colors
  Object.entries(theme.status).forEach(([key, value]) => {
    const cssVar = `--status-${key}`;
    root.style.setProperty(cssVar, value);
  });
  
  // Apply radius
  root.style.setProperty('--radius', theme.radius);
}

export function getSystemTheme(): ThemeName {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}