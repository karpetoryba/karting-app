import { useCallback, useState } from 'react';

import {
  formatLapTime,
  lapTimeApi,
  LeaderboardEntry,
  PilotStats,
} from '../../../services/lapTimeApi';

export { formatLapTime };

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pilotStats, setPilotStats] = useState<PilotStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lapTimeApi.getLeaderboard(10);
      setLeaderboard(data);
    } catch (err: any) {
      setError('Impossible de charger le classement');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPilotStats = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setPilotStats(null);
      return;
    }

    setIsLoadingStats(true);
    setError(null);
    try {
      const stats = await lapTimeApi.getPilotStats(email);
      setPilotStats(stats);
    } catch (err: any) {
      setError('Impossible de charger vos statistiques');
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

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
