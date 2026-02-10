import { useCallback, useState } from 'react';

import { FetchInterface } from '../../../shared/fetch';
import { Session } from '../../../shared/fakeFetch';

interface UseListSessionsProps {
  fetch: FetchInterface;
}

export function useListSessions({ fetch }: UseListSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch<Session[]>('/sessions', { method: 'GET' });
      if (response.ok && response.data) {
        setSessions(response.data);
      } else {
        setError(response.error || 'Impossible de charger les sessions');
      }
    } catch (err: unknown) {
      setError('Impossible de charger les sessions');
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  return {
    sessions,
    isLoading,
    error,
    loadSessions,
  };
}
