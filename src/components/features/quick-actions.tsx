'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Zap, BarChart3 } from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  disabled?: boolean;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
  onQuickAction?: (actionId: string) => void;
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

const defaultActions: QuickAction[] = [
  {
    id: 'schedule-meeting',
    label: 'Schedule Meeting',
    icon: Calendar,
    action: () => {},
  },
  {
    id: 'quick-task',
    label: 'Quick Task',
    icon: Zap,
    action: () => {},
  },
  {
    id: 'time-block',
    label: 'Time Block',
    icon: Clock,
    action: () => {},
  },
  {
    id: 'view-analytics',
    label: 'Analytics',
    icon: BarChart3,
    action: () => {},
  },
];

export function QuickActions({
  actions = defaultActions,
  onQuickAction,
  className,
  variant = 'horizontal',
}: QuickActionsProps) {
  const handleAction = (action: QuickAction) => {
    action.action();
    onQuickAction?.(action.id);
  };

  return (
    <div className={cn(
      'flex gap-2',
      variant === 'vertical' ? 'flex-col' : 'flex-row flex-wrap justify-center',
      className
    )}>
      {actions.map((action) => {
        const Icon = action.icon;
        
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            onClick={() => handleAction(action)}
            disabled={action.disabled}
            className={cn(
              'flex items-center space-x-2 text-gray-600 hover:text-gray-900',
              'hover:bg-white/50 transition-colors',
              variant === 'vertical' && 'justify-start w-full'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}