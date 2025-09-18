import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { InputComponent } from '../input-component';
import { setupTestEnvironment, cleanupTestEnvironment } from '@/test-utils';

// Mock hooks
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: unknown) => value,
}));

jest.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ['', jest.fn()],
}));

describe('InputComponent', () => {
  const defaultProps = {
    onSubmit: jest.fn(),
    placeholder: 'Enter your task...',
    isLoading: false,
    enableVoiceInput: false,
    animated: false,
  };

  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('Rendering', () => {
    it('renders input field with placeholder', () => {
      render(<InputComponent {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Enter your task...')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<InputComponent {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders voice input button when enabled', () => {
      render(<InputComponent {...defaultProps} enableVoiceInput={true} />);
      
      expect(screen.getByRole('button', { name: /voice input/i })).toBeInTheDocument();
    });

    it('does not render voice input button when disabled', () => {
      render(<InputComponent {...defaultProps} enableVoiceInput={false} />);
      
      expect(screen.queryByRole('button', { name: /voice input/i })).not.toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('updates input value when typing', async () => {
      render(<InputComponent {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      fireEvent.change(input, { target: { value: 'New task' } });
      
      expect(input).toHaveValue('New task');
    });

    it('calls onSubmit when form is submitted', async () => {
      const onSubmit = jest.fn();
      render(<InputComponent {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      fireEvent.change(input, { target: { value: 'Test task' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('Test task');
      });
    });

    it('calls onSubmit when Enter key is pressed', async () => {
      const onSubmit = jest.fn();
      render(<InputComponent {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      
      fireEvent.change(input, { target: { value: 'Test task' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('Test task');
      });
    });

    it('does not submit empty input', async () => {
      const onSubmit = jest.fn();
      render(<InputComponent {...defaultProps} onSubmit={onSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      fireEvent.click(submitButton);
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('trims whitespace from input', async () => {
      const onSubmit = jest.fn();
      render(<InputComponent {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      fireEvent.change(input, { target: { value: '  Test task  ' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('Test task');
      });
    });
  });

  describe('Loading State', () => {
    it('disables input and button when loading', () => {
      render(<InputComponent {...defaultProps} isLoading={true} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('shows loading spinner when loading', () => {
      render(<InputComponent {...defaultProps} isLoading={true} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('changes submit button text when loading', () => {
      render(<InputComponent {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows validation error for invalid input', async () => {
      render(<InputComponent {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      
      // Test with very long input
      const longInput = 'a'.repeat(1000);
      fireEvent.change(input, { target: { value: longInput } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText(/too long/i)).toBeInTheDocument();
      });
    });

    it('clears validation error when input becomes valid', async () => {
      render(<InputComponent {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      
      // First, trigger validation error
      const longInput = 'a'.repeat(1000);
      fireEvent.change(input, { target: { value: longInput } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.getByText(/too long/i)).toBeInTheDocument();
      });
      
      // Then, fix the input
      fireEvent.change(input, { target: { value: 'Valid task' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/too long/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Voice Input', () => {
    beforeEach(() => {
      // Mock Speech Recognition API
      const mockSpeechRecognition = {
        start: jest.fn(),
        stop: jest.fn(),
        abort: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        continuous: false,
        interimResults: false,
        lang: 'en-US',
      };

      (global as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition);
      (global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
    });

    it('starts voice recognition when voice button is clicked', async () => {
      render(<InputComponent {...defaultProps} enableVoiceInput={true} />);
      
      const voiceButton = screen.getByRole('button', { name: /voice input/i });
      fireEvent.click(voiceButton);
      
      // Should show listening state
      await waitFor(() => {
        expect(screen.getByText(/listening/i)).toBeInTheDocument();
      });
    });

    it('handles voice recognition not supported', () => {
      // Remove Speech Recognition support
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;
      
      render(<InputComponent {...defaultProps} enableVoiceInput={true} />);
      
      // Voice button should not be rendered
      expect(screen.queryByRole('button', { name: /voice input/i })).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('supports Ctrl+Enter to submit', async () => {
      const onSubmit = jest.fn();
      render(<InputComponent {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      
      fireEvent.change(input, { target: { value: 'Test task' } });
      fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('Test task');
      });
    });

    it('supports Cmd+Enter to submit on Mac', async () => {
      const onSubmit = jest.fn();
      render(<InputComponent {...defaultProps} onSubmit={onSubmit} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      
      fireEvent.change(input, { target: { value: 'Test task' } });
      fireEvent.keyDown(input, { key: 'Enter', metaKey: true });
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('Test task');
      });
    });

    it('clears input with Escape key', async () => {
      render(<InputComponent {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      
      fireEvent.change(input, { target: { value: 'Test task' } });
      fireEvent.keyDown(input, { key: 'Escape' });
      
      expect(input).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<InputComponent {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      expect(input).toHaveAttribute('aria-label');
    });

    it('associates error messages with input', async () => {
      render(<InputComponent {...defaultProps} />);
      
      const input = screen.getByPlaceholderText('Enter your task...');
      
      // Trigger validation error
      const longInput = 'a'.repeat(1000);
      fireEvent.change(input, { target: { value: longInput } });
      fireEvent.blur(input);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/too long/i);
        expect(input).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });

    it('announces loading state to screen readers', () => {
      render(<InputComponent {...defaultProps} isLoading={true} />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });
  });
});