'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { TimelineStatus } from '@/types/task';
import { motion, Variants } from 'framer-motion';
import { Check } from 'lucide-react';

export interface StatusRingProps {
  status: TimelineStatus;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showCheckmark?: boolean;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

const checkmarkSizes = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5',
};

export function StatusRing({
  status,
  animated = true,
  size = 'md',
  className,
  showCheckmark = true,
}: StatusRingProps) {
  const getStatusStyles = () => {
    switch (status) {
      case TimelineStatus.COMPLETED:
        return {
          ring: 'border-gray-800 bg-gray-800',
          glow: 'shadow-gray-800/20',
          checkmark: false,
        };
      case TimelineStatus.RECENTLY_COMPLETED:
        return {
          ring: 'border-green-500 bg-green-500',
          glow: 'shadow-green-500/30',
          checkmark: true,
        };
      case TimelineStatus.UPCOMING:
        return {
          ring: 'border-gray-300 bg-white',
          glow: 'shadow-gray-300/20',
          checkmark: false,
        };
      default:
        return {
          ring: 'border-gray-300 bg-white',
          glow: 'shadow-gray-300/20',
          checkmark: false,
        };
    }
  };

  const styles = getStatusStyles();
  
  const ringVariants: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 20,
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }
    },
  };

  const checkmarkVariants: Variants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        delay: 0.2,
        type: 'spring' as const,
        stiffness: 400,
        damping: 15,
      }
    },
  };

  const RingComponent = animated ? motion.div : 'div';
  const CheckmarkComponent = animated ? motion.div : 'div';

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <RingComponent
        className={cn(
          'rounded-full border-2 flex items-center justify-center',
          'shadow-lg transition-all duration-200',
          sizeClasses[size],
          styles.ring,
          styles.glow
        )}
        {...(animated && {
          variants: ringVariants,
          initial: 'initial',
          animate: 'animate',
          whileHover: 'pulse'
        })}
        data-testid="status-ring"
      >
        {styles.checkmark && showCheckmark && (
          <CheckmarkComponent
            {...(animated && {
              variants: checkmarkVariants,
              initial: 'initial',
              animate: 'animate'
            })}
          >
            <Check 
              className={cn('text-white', checkmarkSizes[size])} 
              data-testid="check-icon"
            />
          </CheckmarkComponent>
        )}
      </RingComponent>

      {/* Animated border for recently completed tasks */}
      {status === TimelineStatus.RECENTLY_COMPLETED && animated && (
        <motion.div
          className={cn(
            'absolute rounded-full border-2 border-green-400',
            sizeClasses[size]
          )}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ 
            scale: 1.5, 
            opacity: 0,
            transition: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }
          }}
        />
      )}
    </div>
  );
}