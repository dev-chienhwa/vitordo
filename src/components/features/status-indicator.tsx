'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff, Zap, AlertCircle } from 'lucide-react';

export interface StatusIndicatorProps {
  llmStatus?: 'connected' | 'disconnected' | 'error';
  className?: string;
  showText?: boolean;
}

export function StatusIndicator({
  llmStatus = 'connected',
  className,
  showText = false,
}: StatusIndicatorProps) {
  const isOnline = useOnlineStatus();

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        text: 'Offline',
        description: 'No internet connection',
      };
    }

    switch (llmStatus) {
      case 'connected':
        return {
          icon: Zap,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          text: 'Ready',
          description: 'AI assistant is ready',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          text: 'Error',
          description: 'AI assistant error',
        };
      case 'disconnected':
      default:
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          text: 'Connecting',
          description: 'Connecting to AI assistant',
        };
    }
  };

  const status = getStatusInfo();
  const Icon = status.icon;

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full',
        status.bgColor
      )}>
        <Icon className={cn('w-4 h-4', status.color)} />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn('text-sm font-medium', status.color)}>
            {status.text}
          </span>
          <span className="text-xs text-gray-500">
            {status.description}
          </span>
        </div>
      )}
    </div>
  );
}