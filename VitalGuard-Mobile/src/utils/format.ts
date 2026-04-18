export const formatTimeAgo = (isoTs: string): string => {
  const diffMs = Date.now() - new Date(isoTs).getTime();
  const sec = Math.max(1, Math.floor(diffMs / 1000));
  if (sec < 60) {
    return `${sec}s ago`;
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const hour = Math.floor(min / 60);
  return `${hour}h ago`;
};

export const formatClock = (isoTs: string): string =>
  new Date(isoTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

export const formatLatency = (value: number): string => `${Math.round(value)} ms`;
