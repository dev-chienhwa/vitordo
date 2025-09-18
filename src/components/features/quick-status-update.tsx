'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useTaskStatusUpdater } from '@/hooks/useTaskStatusUpdater';
import { useDebounce } from '@/hooks/useDebounce';
import { Send, Loader2 } from 'lucide-react';

export interface QuickStatusUpdateProps {
  className?: string;
  placeholder?: string;
  onSuccess?: () => void;
}

export function QuickStatusUpdate({
  className,
  placeholder = 'Update task status... (e.g., "I finished the meeting")',
  onSuccess,
}: QuickStatusUpdateProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { updateTaskStatusViaInput, isUpdating } = useTaskStatusUpdater();
  const debouncedInput = useDebounce(input, 300);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isUpdating) return;

    try {
      const result = await updateTaskStatusViaInput(input.trim());
      
      if (result.success) {
        setInput('');
        setIsExpanded(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setInput('');
    }
  };

  return (
    <div className={cn('relative', className)}>
      {!isExpanded ? (
        /* Collapsed State - Quick Access Button */
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className={cn(
            'w-full justify-start text-left text-gray-500',
            'hover:text-gray-700 hover:bg-gray-50',
            'border border-dashed border-gray-300 hover:border-gray-400'
          )}
        >
          <Send className="w-4 h-4 mr-2" />
          Quick status update...
        </Button>
      ) : (
        /* Expanded State - Full Input */
        <AnimatedContainer direction="down" duration={0.2}>
          <Card className="border-blue-200 shadow-md">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isUpdating}
                    autoFocus
                    className="border-0 shadow-none focus:ring-0 p-0 text-sm"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl + Enter</kbd> to submit, <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to cancel
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsExpanded(false);
                        setInput('');
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!input.trim() || isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" />
                          Update
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}
    </div>
  );
}