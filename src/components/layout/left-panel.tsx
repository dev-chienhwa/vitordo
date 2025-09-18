'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { WelcomeHeader } from '@/components/features/welcome-header';
import { InputComponent } from '@/components/features/input-component';
import { StatusIndicator } from '@/components/features/status-indicator';
import { QuickActions, QuickAction } from '@/components/features/quick-actions';
import { Container } from '@/components/ui/container';
import { AnimatedContainer } from '@/components/ui/animated-container';

export interface LeftPanelProps {
  onTaskSubmit: (input: string) => void;
  isLoading?: boolean;
  className?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  inputPlaceholder?: string;
  enableVoiceInput?: boolean;
  animated?: boolean;
  llmStatus?: 'connected' | 'disconnected' | 'error';
  quickActions?: QuickAction[];
  onQuickAction?: (actionId: string) => void;
  showStatusIndicator?: boolean;
  showQuickActions?: boolean;
}

export function LeftPanel({
  onTaskSubmit,
  isLoading = false,
  className,
  welcomeTitle,
  welcomeSubtitle,
  inputPlaceholder,
  enableVoiceInput = true,
  animated = true,
  llmStatus = 'connected',
  quickActions,
  onQuickAction,
  showStatusIndicator = true,
  showQuickActions = true,
}: LeftPanelProps) {
  const content = (
    <div className={cn(
      'h-full flex flex-col justify-center items-center',
      'bg-gradient-to-br from-blue-50 to-indigo-100',
      'border-r border-gray-200',
      className
    )}>
      <Container size="sm" className="flex flex-col justify-between min-h-full py-8">
        {/* Status Indicator */}
        {showStatusIndicator && (
          <div className="flex justify-end mb-4">
            <StatusIndicator llmStatus={llmStatus} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          {/* Welcome Header */}
          <WelcomeHeader
            title={welcomeTitle}
            subtitle={welcomeSubtitle}
            animated={animated}
          />

          {/* Input Component */}
          <InputComponent
            onSubmit={onTaskSubmit}
            placeholder={inputPlaceholder}
            isLoading={isLoading}
            enableVoiceInput={enableVoiceInput}
            animated={animated}
          />

          {/* Additional Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Describe your tasks in natural language
            </p>
            <p className="text-xs text-gray-500">
              I'll break them down and schedule them for you
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Quick Actions
              </p>
            </div>
            <QuickActions
              actions={quickActions}
              onQuickAction={onQuickAction}
              variant="horizontal"
            />
          </div>
        )}
      </Container>
    </div>
  );

  if (animated) {
    return (
      <AnimatedContainer
        direction="left"
        duration={0.8}
        className="h-full"
      >
        {content}
      </AnimatedContainer>
    );
  }

  return content;
}