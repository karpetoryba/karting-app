import { useCallback, useState } from 'react';

import { FetchInterface } from '../../../shared/fetch';
import { Booking, Session } from '../../../shared/fakeFetch';

interface UseBookSessionProps {
  fetch: FetchInterface;
}

export function useBookSession({ fetch }: UseBookSessionProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch<Session[]>('/sessions/published', { method: 'GET' });
      if (response.ok && response.data) {
        setSessions(response.data);
      } else {
        setError(response.error || 'Impossible de charger les sessions disponibles');
      }
    } catch (err: unknown) {
      setError('Impossible de charger les sessions disponibles');
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      }
      return [...prev, sessionId];
    });
  }, []);

  const calculateTotal = useCallback(
    () =>
      selectedSessions.reduce((total, sessionId) => {
        const session = sessions.find(s => s.id === sessionId);
        return total + (session?.price || 0);
      }, 0),
    [selectedSessions, sessions]
  );

  const bookSessions = useCallback(
    async (clientName: string, clientEmail: string) => {
      if (selectedSessions.length === 0) {
        setError('Veuillez sélectionner au moins une session');
        return null;
      }

      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);

      try {
        const response = await fetch<Booking>('/bookings', {
          method: 'POST',
          body: {
            sessionIds: selectedSessions,
            clientName,
            clientEmail,
          },
        });

        if (response.ok && response.data) {
          setIsSuccess(true);
          return response.data;
        } else {
          setError(response.error || 'Une erreur est survenue lors de la réservation');
          return null;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la réservation';
        setError(errorMessage);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetch, selectedSessions]
  );

  return {
    sessions,
    selectedSessions,
    isLoading,
    isSubmitting,
    error,
    isSuccess,
    loadSessions,
    toggleSessionSelection,
    calculateTotal,
    bookSessions,
  };
}
