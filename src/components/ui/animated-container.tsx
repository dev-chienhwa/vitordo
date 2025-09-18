'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function AnimatedContainer({
  children,
  className,
  delay = 0,
  duration = 0.3,
  direction = 'up',
}: AnimatedContainerProps) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
      x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration,
        delay,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.3,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface SlideInProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
}

export function SlideIn({
  children,
  className,
  direction = 'left',
  delay = 0,
  duration = 0.3,
}: SlideInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -50, opacity: 0 };
      case 'right':
        return { x: 50, opacity: 0 };
      case 'up':
        return { y: -50, opacity: 0 };
      case 'down':
        return { y: 50, opacity: 0 };
      default:
        return { x: -50, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface ScaleInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 0.3,
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}