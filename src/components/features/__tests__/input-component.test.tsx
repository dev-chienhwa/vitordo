import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InputComponent } from '../input-component';

// Mock hooks
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

describe('InputComponent', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText('Describe what you need to do...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule tasks/i })).toBeInTheDocument();
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test task input');
    
    expect(textarea).toHaveValue('Test task input');
  });

  it('submits form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /schedule tasks/i });
    
    await user.type(textarea, 'Test task input');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test task input');
  });

  it('submits form with Cmd+Enter', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    
    await user.type(textarea, 'Test task input');
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test task input');
  });

  it('clears input after submission', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /schedule tasks/i });
    
    await user.type(textarea, 'Test task input');
    await user.click(submitButton);
    
    expect(textarea).toHaveValue('');
  });

  it('disables submit when input is empty', () => {
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /schedule tasks/i });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit when loading', () => {
    render(<InputComponent onSubmit={mockOnSubmit} isLoading={true} />);
    
    const submitButton = screen.getByRole('button', { name: /processing/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} showCharacterCount={true} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test');
    
    expect(screen.getByText('4/1000')).toBeInTheDocument();
  });

  it('shows error when input is too long', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} maxLength={5} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'This is too long');
    
    await waitFor(() => {
      expect(screen.getByText(/input is too long/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid input', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'ab'); // Too short
    
    await waitFor(() => {
      expect(screen.getByText(/input must be at least 3 characters long/i)).toBeInTheDocument();
    });
  });

  it('disables all inputs when disabled prop is true', () => {
    render(<InputComponent onSubmit={mockOnSubmit} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /schedule tasks/i });
    
    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows keyboard shortcut hint', () => {
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText(/cmd\/ctrl \+ enter/i)).toBeInTheDocument();
  });

  it('does not submit empty or whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /schedule tasks/i });
    
    await user.type(textarea, '   ');
    await user.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('trims whitespace from submitted input', async () => {
    const user = userEvent.setup();
    render(<InputComponent onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /schedule tasks/i });
    
    await user.type(textarea, '  Test task input  ');
    await user.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test task input');
  });
});