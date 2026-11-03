import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import type { LogEntry } from './EventLog';

type EventLogContextValue = {
  entries: LogEntry[];
  logEvent: (message: string) => void;
  clear: () => void;
};

const EventLogContext = createContext<EventLogContextValue | null>(null);

export function EventLogProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const logEvent = useCallback((message: string) => {
    setEntries((prev) => [...prev, { time: new Date().toLocaleTimeString('vi-VN'), message }]);
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  return <EventLogContext.Provider value={{ entries, logEvent, clear }}>{children}</EventLogContext.Provider>;
}

export function useEventLog() {
  const ctx = useContext(EventLogContext);
  if (!ctx) throw new Error('useEventLog must be used within EventLogProvider');
  return ctx;
}
