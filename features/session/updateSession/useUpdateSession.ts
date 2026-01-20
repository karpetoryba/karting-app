import { useCallback, useState } from 'react';

import { FetchInterface } from '../../../shared/fetch';
import { Session } from '../../../shared/fakeFetch';

// Payload pour la mise à jour (tous les champs sont optionnels sauf id)
type UpdateSessionPayload = Partial<Omit<Session, 'id' | 'status'>> & {
  status?: Session['status'];
};

// Props avec injection de dépendance
interface UseUpdateSessionProps {
  fetch: FetchInterface;
}

export function useUpdateSession({ fetch }: UseUpdateSessionProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Charger une session par son ID
  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch<Session>(`/sessions/${sessionId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        setError(response.error || 'Session introuvable');
        return null;
      }

      setSession(response.data || null);
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger la session';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  // Mettre à jour une session
  const updateSession = useCallback(async (sessionId: string, payload: UpdateSessionPayload) => {
    setIsUpdating(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch<Session>(`/sessions/${sessionId}`, {
        method: 'PUT',
        body: payload,
      });

      if (!response.ok) {
        setError(response.error || 'Une erreur est survenue lors de la mise à jour de la session');
        return null;
      }

      setSession(response.data || null);
      setIsSuccess(true);
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la mise à jour de la session';
      setError(errorMessage);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [fetch]);

  // Annuler une session
  const cancelSession = useCallback(async (sessionId: string) => {
    return updateSession(sessionId, { status: 'cancelled' });
  }, [updateSession]);

  return {
    session,
    isLoading,
    isUpdating,
    error,
    isSuccess,
    loadSession,
    updateSession,
    cancelSession,
  };
}
