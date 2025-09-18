'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { AnimatedContainer } from '@/components/ui/animated-container';

export interface WelcomeHeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  animated?: boolean;
}

export function WelcomeHeader({
  title = 'Input,',
  subtitle = "A'll be Scheduled!",
  className,
  animated = true,
}: WelcomeHeaderProps) {
  const content = (
    <div className={cn('text-center space-y-2', className)}>
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl">👋</span>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>
      </div>
      <p className="text-lg text-gray-600 font-medium">
        {subtitle}
      </p>
    </div>
  );

  if (animated) {
    return (
      <AnimatedContainer
        direction="up"
        delay={0.1}
        duration={0.6}
        className={className}
      >
        {content}
      </AnimatedContainer>
    );
  }

  return content;
}