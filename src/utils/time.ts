// Time-related utility functions

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeRange(startTime: Date, endTime: Date): string {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  return `${start}—${end}`;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  }
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60);
}

export function getTimeDifference(startTime: Date, endTime: Date): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const diffInMs = endTime.getTime() - startTime.getTime();
  const totalMinutes = Math.floor(diffInMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes, totalMinutes };
}

export function parseTimeString(timeString: string): Date | null {
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeString.match(timeRegex);
  
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours > 23 || minutes > 59) return null;
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function getTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}