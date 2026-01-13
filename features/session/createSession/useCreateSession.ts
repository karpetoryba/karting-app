import { useState } from 'react';

import { FetchInterface } from '../../../shared/fetch';

// Type pour la session
export interface Session {
  id: string;
  dateTime: Date;
  duration: number;
  availableKarts: number;
  price: number;
  status: 'published' | 'draft' | 'cancelled';
}

type CreateSessionPayload = Omit<Session, 'id' | 'status'>;

// Props avec injection de dépendance
interface UseCreateSessionProps {
  fetch: FetchInterface;
}

export function useCreateSession({ fetch }: UseCreateSessionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const createSession = async (payload: CreateSessionPayload) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch<Session>('/sessions', {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        setError(response.error || 'Une erreur est survenue lors de la création de la session');
        return null;
      }

      setIsSuccess(true);
      return response.data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de la session';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSession,
    isLoading,
    error,
    isSuccess,
  };
}
