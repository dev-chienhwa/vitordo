import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusRing } from '../status-ring';
import { TimelineStatus } from '@/types/task';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

describe('StatusRing', () => {
  it('renders completed status with black ring', () => {
    render(<StatusRing status={TimelineStatus.COMPLETED} animated={false} />);
    const ring = screen.getByTestId('status-ring');
    expect(ring).toHaveClass('border-gray-800', 'bg-gray-800');
  });

  it('renders recently completed status with green ring and checkmark', () => {
    render(<StatusRing status={TimelineStatus.RECENTLY_COMPLETED} animated={false} />);
    const ring = screen.getByTestId('status-ring');
    const checkmark = screen.getByTestId('check-icon');
    expect(ring).toHaveClass('border-green-500', 'bg-green-500');
    expect(checkmark).toBeInTheDocument();
  });

  it('renders upcoming status with gray-white ring', () => {
    render(<StatusRing status={TimelineStatus.UPCOMING} animated={false} />);
    const ring = screen.getByTestId('status-ring');
    expect(ring).toHaveClass('border-gray-300', 'bg-white');
  });

  it('supports different sizes', () => {
    const { rerender } = render(<StatusRing status={TimelineStatus.UPCOMING} size="sm" animated={false} />);
    let ring = screen.getByTestId('status-ring');
    expect(ring).toHaveClass('w-3', 'h-3');

    rerender(<StatusRing status={TimelineStatus.UPCOMING} size="lg" animated={false} />);
    ring = screen.getByTestId('status-ring');
    expect(ring).toHaveClass('w-6', 'h-6');
  });

  it('can disable animations', () => {
    render(<StatusRing status={TimelineStatus.RECENTLY_COMPLETED} animated={false} />);
    const ring = screen.getByTestId('status-ring');
    expect(ring).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('hides checkmark when showCheckmark is false', () => {
    render(<StatusRing status={TimelineStatus.RECENTLY_COMPLETED} showCheckmark={false} animated={false} />);
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
  });

  it('supports animations when enabled', () => {
    render(<StatusRing status={TimelineStatus.RECENTLY_COMPLETED} animated={true} />);
    const ring = screen.getByTestId('status-ring');
    expect(ring).toBeInTheDocument();
  });
});