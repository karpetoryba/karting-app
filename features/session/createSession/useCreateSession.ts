import { useState } from 'react';

import { Session, sessionApi } from '../../../services/sessionApi';

type CreateSessionPayload = Omit<Session, 'id' | 'status'>;

export function useCreateSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const createSession = async (payload: CreateSessionPayload) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const created = await sessionApi.createSession(payload);
      setIsSuccess(true);
      return created;
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue lors de la création de la session');
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

