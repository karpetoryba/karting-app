// Fake API service for lap times and leaderboard

export interface LapTime {
  id: string;
  pilotName: string;
  pilotEmail: string;
  sessionId: string;
  lapTimeMs: number; // Temps en millisecondes
  recordedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  pilotName: string;
  pilotEmail: string;
  bestTimeMs: number;
  totalSessions: number;
}

export interface PilotStats {
  pilotName: string;
  pilotEmail: string;
  bestTimeMs: number;
  averageTimeMs: number;
  totalSessions: number;
  rank: number;
  totalPilots: number;
}

// In-memory storage (simulating a database)
let lapTimes: LapTime[] = [
  // Données de démonstration
  {
    id: 'demo-1',
    pilotName: 'Lucas M.',
    pilotEmail: 'lucas@example.com',
    sessionId: 'demo-session-1',
    lapTimeMs: 83456, // 1:23.456
    recordedAt: new Date('2025-01-01'),
  },
  {
    id: 'demo-2',
    pilotName: 'Marie P.',
    pilotEmail: 'marie@example.com',
    sessionId: 'demo-session-2',
    lapTimeMs: 84012, // 1:24.012
    recordedAt: new Date('2025-01-02'),
  },
  {
    id: 'demo-3',
    pilotName: 'Thomas D.',
    pilotEmail: 'thomas@example.com',
    sessionId: 'demo-session-3',
    lapTimeMs: 85890, // 1:25.890
    recordedAt: new Date('2025-01-03'),
  },
  {
    id: 'demo-4',
    pilotName: 'Emma L.',
    pilotEmail: 'emma@example.com',
    sessionId: 'demo-session-4',
    lapTimeMs: 86234, // 1:26.234
    recordedAt: new Date('2025-01-04'),
  },
  {
    id: 'demo-5',
    pilotName: 'Hugo B.',
    pilotEmail: 'hugo@example.com',
    sessionId: 'demo-session-5',
    lapTimeMs: 87500, // 1:27.500
    recordedAt: new Date('2025-01-05'),
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Convertir millisecondes en format MM:SS.mmm
export function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Parser un temps au format MM:SS.mmm en millisecondes
export function parseLapTime(timeStr: string): number | null {
  // Format attendu: M:SS.mmm ou MM:SS.mmm
  const regex = /^(\d{1,2}):(\d{2})\.(\d{3})$/;
  const match = timeStr.trim().match(regex);

  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const milliseconds = parseInt(match[3], 10);

  if (seconds >= 60) return null;

  return minutes * 60000 + seconds * 1000 + milliseconds;
}

export const lapTimeApi = {
  // Enregistrer un nouveau temps
  async recordLapTime(
    pilotName: string,
    pilotEmail: string,
    sessionId: string,
    lapTimeMs: number
  ): Promise<LapTime> {
    await delay(300);

    if (!pilotName || pilotName.trim().length === 0) {
      throw new Error('Le nom du pilote est requis');
    }

    if (!pilotEmail || !pilotEmail.includes('@')) {
      throw new Error('Une adresse email valide est requise');
    }

    if (lapTimeMs <= 0) {
      throw new Error('Le temps doit être supérieur à 0');
    }

    const newLapTime: LapTime = {
      id: `laptime-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      pilotName: pilotName.trim(),
      pilotEmail: pilotEmail.trim().toLowerCase(),
      sessionId,
      lapTimeMs,
      recordedAt: new Date(),
    };

    lapTimes.push(newLapTime);
    return newLapTime;
  },

  // Obtenir le classement (meilleur temps par pilote)
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    await delay(300);

    // Grouper par email et trouver le meilleur temps
    const pilotBestTimes: Map<string, { name: string; bestTime: number; sessions: number }> = new Map();

    for (const lt of lapTimes) {
      const existing = pilotBestTimes.get(lt.pilotEmail);
      if (!existing) {
        pilotBestTimes.set(lt.pilotEmail, {
          name: lt.pilotName,
          bestTime: lt.lapTimeMs,
          sessions: 1,
        });
      } else {
        existing.bestTime = Math.min(existing.bestTime, lt.lapTimeMs);
        existing.sessions++;
      }
    }

    // Convertir en tableau et trier
    const entries = Array.from(pilotBestTimes.entries())
      .map(([email, data]) => ({
        pilotEmail: email,
        pilotName: data.name,
        bestTimeMs: data.bestTime,
        totalSessions: data.sessions,
      }))
      .sort((a, b) => a.bestTimeMs - b.bestTimeMs)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return entries;
  },

  // Obtenir les stats d'un pilote
  async getPilotStats(email: string): Promise<PilotStats | null> {
    await delay(200);

    const pilotLapTimes = lapTimes.filter(
      lt => lt.pilotEmail.toLowerCase() === email.toLowerCase()
    );

    if (pilotLapTimes.length === 0) {
      return null;
    }

    const bestTime = Math.min(...pilotLapTimes.map(lt => lt.lapTimeMs));
    const averageTime = pilotLapTimes.reduce((sum, lt) => sum + lt.lapTimeMs, 0) / pilotLapTimes.length;

    // Calculer le rang
    const leaderboard = await this.getLeaderboard(1000);
    const pilotRank = leaderboard.find(e => e.pilotEmail.toLowerCase() === email.toLowerCase());

    return {
      pilotName: pilotLapTimes[0].pilotName,
      pilotEmail: email.toLowerCase(),
      bestTimeMs: bestTime,
      averageTimeMs: Math.round(averageTime),
      totalSessions: pilotLapTimes.length,
      rank: pilotRank?.rank || 0,
      totalPilots: leaderboard.length,
    };
  },

  // Obtenir l'historique d'un pilote
  async getLapTimesByPilot(email: string): Promise<LapTime[]> {
    await delay(200);
    return lapTimes
      .filter(lt => lt.pilotEmail.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  },

  // Clear all lap times (for testing)
  clearLapTimes() {
    lapTimes = [];
  },

  // Reset to demo data
  resetToDemo() {
    lapTimes = [
      {
        id: 'demo-1',
        pilotName: 'Lucas M.',
        pilotEmail: 'lucas@example.com',
        sessionId: 'demo-session-1',
        lapTimeMs: 83456,
        recordedAt: new Date('2025-01-01'),
      },
      {
        id: 'demo-2',
        pilotName: 'Marie P.',
        pilotEmail: 'marie@example.com',
        sessionId: 'demo-session-2',
        lapTimeMs: 84012,
        recordedAt: new Date('2025-01-02'),
      },
      {
        id: 'demo-3',
        pilotName: 'Thomas D.',
        pilotEmail: 'thomas@example.com',
        sessionId: 'demo-session-3',
        lapTimeMs: 85890,
        recordedAt: new Date('2025-01-03'),
      },
      {
        id: 'demo-4',
        pilotName: 'Emma L.',
        pilotEmail: 'emma@example.com',
        sessionId: 'demo-session-4',
        lapTimeMs: 86234,
        recordedAt: new Date('2025-01-04'),
      },
      {
        id: 'demo-5',
        pilotName: 'Hugo B.',
        pilotEmail: 'hugo@example.com',
        sessionId: 'demo-session-5',
        lapTimeMs: 87500,
        recordedAt: new Date('2025-01-05'),
      },
    ];
  },
};
