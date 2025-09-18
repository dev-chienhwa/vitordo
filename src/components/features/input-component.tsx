'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AnimatedContainer } from '@/components/ui/animated-container';
import { useDebounce } from '@/hooks/useDebounce';
import { validateTaskInput } from '@/utils/validation';
import { Send, Mic, MicOff } from 'lucide-react';

export interface InputComponentProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  enableVoiceInput?: boolean;
  autoFocus?: boolean;
  animated?: boolean;
}

export function InputComponent({
  onSubmit,
  placeholder = 'Describe what you need to do...',
  isLoading = false,
  disabled = false,
  className,
  maxLength = 1000,
  showCharacterCount = true,
  enableVoiceInput = false,
  autoFocus = true,
  animated = true,
}: InputComponentProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Debounce input for validation
  const debouncedInput = useDebounce(input, 300);

  // Initialize speech recognition
  useEffect(() => {
    if (enableVoiceInput && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enableVoiceInput]);

  // Validate input
  useEffect(() => {
    if (debouncedInput.trim()) {
      const validation = validateTaskInput(debouncedInput);
      setValidationError(validation.isValid ? null : validation.error || null);
    } else {
      setValidationError(null);
    }
  }, [debouncedInput]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || disabled || validationError) {
      return;
    }

    onSubmit(input.trim());
    setInput('');
    setValidationError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const canSubmit = input.trim() && !isLoading && !disabled && !validationError;
  const characterCount = input.length;
  const isOverLimit = characterCount > maxLength;

  const content = (
    <div className={cn('w-full max-w-md mx-auto space-y-4', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              'min-h-[120px] resize-none pr-12',
              validationError && 'border-red-500 focus:ring-red-500',
              isOverLimit && 'border-red-500 focus:ring-red-500'
            )}
            maxLength={maxLength}
          />
          
          {/* Voice input button */}
          {enableVoiceInput && recognitionRef.current && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={disabled || isLoading}
              className={cn(
                'absolute bottom-3 right-3 p-2 rounded-md transition-colors',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
                isListening && 'bg-red-100 text-red-600',
                (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Character count and validation */}
        <div className="flex justify-between items-center text-sm">
          <div>
            {validationError && (
              <span className="text-red-600">{validationError}</span>
            )}
            {isOverLimit && !validationError && (
              <span className="text-red-600">
                Input is too long ({characterCount}/{maxLength})
              </span>
            )}
          </div>
          
          {showCharacterCount && (
            <span className={cn(
              'text-gray-500',
              isOverLimit && 'text-red-600'
            )}>
              {characterCount}/{maxLength}
            </span>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          loading={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Schedule Tasks
            </>
          )}
        </Button>
      </form>

      {/* Keyboard shortcut hint */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl + Enter</kbd> to submit
        </p>
      </div>
    </div>
  );

  if (animated) {
    return (
      <AnimatedContainer
        direction="up"
        delay={0.3}
        duration={0.6}
        className={className}
      >
        {content}
      </AnimatedContainer>
    );
  }

  return content;
}