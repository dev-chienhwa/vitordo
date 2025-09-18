'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Task, TimelineStatus } from '@/types/task';
import { StatusRing } from './status-ring';
import { Check, Clock, Archive } from 'lucide-react';

export interface TaskStatusTransitionProps {
  task: Task;
  newStatus: TimelineStatus;
  onTransitionComplete?: (task: Task, newStatus: TimelineStatus) => void;
  className?: string;
  showAnimation?: boolean;
  duration?: number;
}

export function TaskStatusTransition({
  task,
  newStatus,
  onTransitionComplete,
  className,
  showAnimation = true,
  duration = 1000,
}: TaskStatusTransitionProps) {
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (newStatus !== currentStatus && showAnimation) {
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setCurrentStatus(newStatus);
        setIsTransitioning(false);
        onTransitionComplete?.(task, newStatus);
      }, duration);

      return () => clearTimeout(timer);
    } else if (newStatus !== currentStatus) {
      setCurrentStatus(newStatus);
      onTransitionComplete?.(task, newStatus);
    }
  }, [newStatus, currentStatus, showAnimation, duration, task, onTransitionComplete]);

  const getStatusInfo = (status: TimelineStatus) => {
    switch (status) {
      case TimelineStatus.UPCOMING:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Upcoming',
          description: 'Ready to start',
        };
      case TimelineStatus.RECENTLY_COMPLETED:
        return {
          icon: Check,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Just Completed',
          description: 'Recently finished',
        };
      case TimelineStatus.COMPLETED:
        return {
          icon: Archive,
          color: 'text-gray-800',
          bgColor: 'bg-gray-200',
          label: 'Completed',
          description: 'Archived',
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Unknown',
          description: 'Unknown status',
        };
    }
  };

  const oldStatusInfo = getStatusInfo(task.status);
  const newStatusInfo = getStatusInfo(newStatus);
  const currentStatusInfo = getStatusInfo(currentStatus);

  if (!showAnimation) {
    return (
      <div className={cn('flex items-center space-x-3', className)}>
        <StatusRing status={currentStatus} animated={false} />
        <div>
          <div className={cn('text-sm font-medium', currentStatusInfo.color)}>
            {currentStatusInfo.label}
          </div>
          <div className="text-xs text-gray-500">
            {currentStatusInfo.description}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {isTransitioning ? (
          <motion.div
            key="transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-lg border"
          >
            {/* Status Transition Animation */}
            <div className="flex items-center space-x-8">
              {/* Old Status */}
              <motion.div
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: 0.5, x: -20 }}
                className="flex flex-col items-center space-y-2"
              >
                <StatusRing status={task.status} animated={false} size="lg" />
                <div className="text-center">
                  <div className={cn('text-sm font-medium', oldStatusInfo.color)}>
                    {oldStatusInfo.label}
                  </div>
                </div>
              </motion.div>

              {/* Transition Arrow */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center"
              >
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                  }}
                  className="text-blue-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.div>
              </motion.div>

              {/* New Status */}
              <motion.div
                initial={{ opacity: 0.5, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center space-y-2"
              >
                <StatusRing status={newStatus} animated={true} size="lg" />
                <div className="text-center">
                  <div className={cn('text-sm font-medium', newStatusInfo.color)}>
                    {newStatusInfo.label}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Task Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h3 className="font-medium text-gray-900 mb-1">
                {task.title}
              </h3>
              <p className="text-sm text-gray-600">
                Status updating to {newStatusInfo.label.toLowerCase()}...
              </p>
            </motion.div>

            {/* Progress Indicator */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: duration / 1000, ease: 'easeInOut' }}
              className="h-1 bg-blue-500 rounded-full"
              style={{ width: '200px' }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center space-x-3"
          >
            <StatusRing status={currentStatus} animated={true} />
            <div>
              <div className={cn('text-sm font-medium', currentStatusInfo.color)}>
                {currentStatusInfo.label}
              </div>
              <div className="text-xs text-gray-500">
                {currentStatusInfo.description}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}