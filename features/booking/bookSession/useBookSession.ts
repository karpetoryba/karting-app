import { useCallback, useState } from 'react';

import { bookingApi } from '../../../services/bookingApi';
import { Session, sessionApi } from '../../../services/sessionApi';

export function useBookSession() {
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
      const publishedSessions = await sessionApi.getPublishedSessions();
      setSessions(publishedSessions);
    } catch (err: any) {
      setError('Impossible de charger les sessions disponibles');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        const booking = await bookingApi.createBooking(
          selectedSessions,
          clientName,
          clientEmail
        );
        setIsSuccess(true);
        return booking;
      } catch (err: any) {
        setError(err?.message || 'Une erreur est survenue lors de la réservation');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedSessions]
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

