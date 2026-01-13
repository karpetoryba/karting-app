import { useCallback, useState } from 'react';

import { FetchInterface } from '../../../shared/fetch';
import { LeaderboardEntry, PilotStats } from '../../../shared/fakeFetch';

// Convertir millisecondes en format MM:SS.mmm
export function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

interface UseLeaderboardProps {
  fetch: FetchInterface;
}

export function useLeaderboard({ fetch }: UseLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pilotStats, setPilotStats] = useState<PilotStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch<LeaderboardEntry[]>('/leaderboard?limit=10', { method: 'GET' });
      if (response.ok && response.data) {
        setLeaderboard(response.data);
      } else {
        setError(response.error || 'Impossible de charger le classement');
      }
    } catch (err: unknown) {
      setError('Impossible de charger le classement');
    } finally {
      setIsLoading(false);
    }
  }, [fetch]);

  const loadPilotStats = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setPilotStats(null);
      return;
    }

    setIsLoadingStats(true);
    setError(null);
    try {
      const response = await fetch<PilotStats | null>(`/pilots/${encodeURIComponent(email)}/stats`, { method: 'GET' });
      if (response.ok) {
        setPilotStats(response.data || null);
      } else {
        setError(response.error || 'Impossible de charger vos statistiques');
      }
    } catch (err: unknown) {
      setError('Impossible de charger vos statistiques');
    } finally {
      setIsLoadingStats(false);
    }
  }, [fetch]);

  const clearPilotStats = useCallback(() => {
    setPilotStats(null);
  }, []);

  return {
    leaderboard,
    pilotStats,
    isLoading,
    isLoadingStats,
    error,
    loadLeaderboard,
    loadPilotStats,
    clearPilotStats,
    formatLapTime,
  };
}
