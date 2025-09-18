'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ActionFeedbackProps {
  type: FeedbackType;
  message: string;
  isVisible: boolean;
  duration?: number;
  onHide?: () => void;
  className?: string;
  position?: 'top' | 'bottom' | 'center';
}

const feedbackIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const feedbackStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-600',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-600',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-yellow-600',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-600',
  },
  loading: {
    container: 'bg-gray-50 border-gray-200 text-gray-800',
    icon: 'text-gray-600',
  },
};

export function ActionFeedback({
  type,
  message,
  isVisible,
  duration = 3000,
  onHide,
  className,
  position = 'bottom',
}: ActionFeedbackProps) {
  useEffect(() => {
    if (isVisible && duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        onHide?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, type, onHide]);

  const Icon = feedbackIcons[type];
  const styles = feedbackStyles[type];

  const positionClasses = {
    top: 'top-4',
    bottom: 'bottom-4',
    center: 'top-1/2 -translate-y-1/2',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? -20 : 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn(
            'fixed left-1/2 transform -translate-x-1/2 z-50',
            positionClasses[position],
            className
          )}
        >
          <div className={cn(
            'flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg',
            'border backdrop-blur-sm max-w-sm',
            styles.container
          )}>
            <Icon className={cn(
              'w-5 h-5 flex-shrink-0',
              styles.icon,
              type === 'loading' && 'animate-spin'
            )} />
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing action feedback
export function useActionFeedback() {
  const [feedback, setFeedback] = useState<{
    type: FeedbackType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false,
  });

  const showFeedback = (type: FeedbackType, message: string) => {
    setFeedback({ type, message, isVisible: true });
  };

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, isVisible: false }));
  };

  const showSuccess = (message: string) => showFeedback('success', message);
  const showError = (message: string) => showFeedback('error', message);
  const showWarning = (message: string) => showFeedback('warning', message);
  const showInfo = (message: string) => showFeedback('info', message);
  const showLoading = (message: string) => showFeedback('loading', message);

  return {
    feedback,
    showFeedback,
    hideFeedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
}