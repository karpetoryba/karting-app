// Fake API service for sessions

export interface Session {
  id: string;
  dateTime: Date;
  duration: number; // in minutes
  availableKarts: number;
  price: number;
  status: 'published' | 'draft' | 'cancelled';
}

// In-memory storage (simulating a database)
let sessions: Session[] = [];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sessionApi = {
  // Create a new session
  async createSession(sessionData: Omit<Session, 'id' | 'status'>): Promise<Session> {
    await delay(500); // Simulate network delay

    // Validate business rules
    // Scénario 3: Refus si la date/heure est dans le passé
    const now = new Date();
    if (sessionData.dateTime <= now) {
      throw new Error('La date/heure doit être dans le futur');
    }

    // Scénario 4: Refus si le prix est inférieur ou égal à 0
    if (sessionData.price <= 0) {
      throw new Error('Le prix doit être strictement supérieur à zéro');
    }

    // Scénario 5: Refus si le nombre de karts est invalide
    if (sessionData.availableKarts <= 0) {
      throw new Error('Le nombre de karts doit être strictement supérieur à zéro');
    }

    // Scénario 2: Création impossible si le créneau est déjà occupé
    const existingSession = sessions.find(s => {
      const sessionStart = new Date(s.dateTime);
      const sessionEnd = new Date(sessionStart.getTime() + s.duration * 60000);
      const newSessionStart = new Date(sessionData.dateTime);
      const newSessionEnd = new Date(newSessionStart.getTime() + sessionData.duration * 60000);

      // Check if time slots overlap
      return (
        (newSessionStart >= sessionStart && newSessionStart < sessionEnd) ||
        (newSessionEnd > sessionStart && newSessionEnd <= sessionEnd) ||
        (newSessionStart <= sessionStart && newSessionEnd >= sessionEnd)
      );
    });

    if (existingSession) {
      throw new Error('Le créneau est déjà occupé');
    }

    // Create session with default status "published"
    const newSession: Session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...sessionData,
      status: 'published',
    };

    sessions.push(newSession);
    return newSession;
  },

  // Get all published sessions (for clients to book)
  async getPublishedSessions(): Promise<Session[]> {
    await delay(300);
    return sessions.filter(s => s.status === 'published' && new Date(s.dateTime) > new Date());
  },

  // Get all sessions (for staff/admin)
  async getSessions(): Promise<Session[]> {
    await delay(300);
    return [...sessions];
  },

  // Get session by ID (for future use)
  async getSessionById(id: string): Promise<Session | null> {
    await delay(200);
    return sessions.find(s => s.id === id) || null;
  },

  // Clear all sessions (for testing)
  clearSessions() {
    sessions = [];
  },
};

