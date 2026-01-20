// Fake fetch implementation - simule les appels API en mémoire

import { FetchInterface, FetchOptions, FetchResponse } from './fetch';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============ TYPES ============

export interface Session {
  id: string;
  dateTime: Date;
  duration: number;
  availableKarts: number;
  price: number;
  status: 'published' | 'draft' | 'cancelled';
}

export interface Booking {
  id: string;
  sessionIds: string[];
  clientName: string;
  clientEmail: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: 'card' | 'cash' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  completedAt?: Date;
}

export interface LapTime {
  id: string;
  pilotName: string;
  pilotEmail: string;
  sessionId: string;
  lapTimeMs: number;
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

// ============ IN-MEMORY STORAGE ============

let sessions: Session[] = [];
let bookings: Booking[] = [];
let payments: Payment[] = [];
let lapTimes: LapTime[] = [
  // Demo data
  { id: 'demo-1', pilotName: 'Lucas M.', pilotEmail: 'lucas@example.com', sessionId: 'demo-session-1', lapTimeMs: 83456, recordedAt: new Date('2025-01-01') },
  { id: 'demo-2', pilotName: 'Marie P.', pilotEmail: 'marie@example.com', sessionId: 'demo-session-2', lapTimeMs: 84012, recordedAt: new Date('2025-01-02') },
  { id: 'demo-3', pilotName: 'Thomas D.', pilotEmail: 'thomas@example.com', sessionId: 'demo-session-3', lapTimeMs: 85890, recordedAt: new Date('2025-01-03') },
  { id: 'demo-4', pilotName: 'Emma L.', pilotEmail: 'emma@example.com', sessionId: 'demo-session-4', lapTimeMs: 86234, recordedAt: new Date('2025-01-04') },
  { id: 'demo-5', pilotName: 'Hugo B.', pilotEmail: 'hugo@example.com', sessionId: 'demo-session-5', lapTimeMs: 87500, recordedAt: new Date('2025-01-05') },
];

// ============ HELPER FUNCTIONS ============

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

const getLeaderboardData = (limit: number = 10): LeaderboardEntry[] => {
  const pilotBestTimes: Map<string, { name: string; bestTime: number; sessions: number }> = new Map();

  for (const lt of lapTimes) {
    const existing = pilotBestTimes.get(lt.pilotEmail);
    if (!existing) {
      pilotBestTimes.set(lt.pilotEmail, { name: lt.pilotName, bestTime: lt.lapTimeMs, sessions: 1 });
    } else {
      existing.bestTime = Math.min(existing.bestTime, lt.lapTimeMs);
      existing.sessions++;
    }
  }

  return Array.from(pilotBestTimes.entries())
    .map(([email, data]) => ({
      pilotEmail: email,
      pilotName: data.name,
      bestTimeMs: data.bestTime,
      totalSessions: data.sessions,
    }))
    .sort((a, b) => a.bestTimeMs - b.bestTimeMs)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
};

// ============ FAKE FETCH IMPLEMENTATION ============

export const fakeFetch: FetchInterface = async <T = unknown>(
  url: string,
  options: FetchOptions = { method: 'GET' }
): Promise<FetchResponse<T>> => {
  const { method, body } = options;

  // ============ SESSIONS ============

  // GET /sessions
  if (method === 'GET' && url === '/sessions') {
    await delay(300);
    return { ok: true, data: [...sessions] as T, status: 200 };
  }

  // GET /sessions/published
  if (method === 'GET' && url === '/sessions/published') {
    await delay(300);
    const published = sessions.filter(s => s.status === 'published' && new Date(s.dateTime) > new Date());
    return { ok: true, data: published as T, status: 200 };
  }

  // GET /sessions/:id
  if (method === 'GET' && url.startsWith('/sessions/') && !url.includes('published')) {
    await delay(200);
    const id = url.replace('/sessions/', '');
    const session = sessions.find(s => s.id === id);
    if (session) {
      return { ok: true, data: session as T, status: 200 };
    }
    return { ok: false, error: 'Session not found', status: 404 };
  }

  // POST /sessions
  if (method === 'POST' && url === '/sessions') {
    await delay(500);
    const sessionData = body as Omit<Session, 'id' | 'status'>;

    if (!sessionData) {
      return { ok: false, error: 'Body is required', status: 400 };
    }

    const dateTime = new Date(sessionData.dateTime);
    if (dateTime <= new Date()) {
      return { ok: false, error: 'La date/heure doit être dans le futur', status: 400 };
    }
    if (sessionData.price <= 0) {
      return { ok: false, error: 'Le prix doit être strictement supérieur à zéro', status: 400 };
    }
    if (sessionData.availableKarts <= 0) {
      return { ok: false, error: 'Le nombre de karts doit être strictement supérieur à zéro', status: 400 };
    }

    // Check overlap
    const hasOverlap = sessions.some(s => {
      const sStart = new Date(s.dateTime).getTime();
      const sEnd = sStart + s.duration * 60000;
      const newStart = dateTime.getTime();
      const newEnd = newStart + sessionData.duration * 60000;
      return (newStart >= sStart && newStart < sEnd) || (newEnd > sStart && newEnd <= sEnd) || (newStart <= sStart && newEnd >= sEnd);
    });

    if (hasOverlap) {
      return { ok: false, error: 'Le créneau est déjà occupé', status: 409 };
    }

    const newSession: Session = {
      id: generateId('session'),
      ...sessionData,
      dateTime,
      status: 'published',
    };
    sessions.push(newSession);
    return { ok: true, data: newSession as T, status: 201 };
  }

  // PUT /sessions/:id
  if (method === 'PUT' && url.match(/^\/sessions\/[^/]+$/)) {
    await delay(500);
    const id = url.replace('/sessions/', '');
    const sessionIndex = sessions.findIndex(s => s.id === id);

    if (sessionIndex === -1) {
      return { ok: false, error: 'Session introuvable', status: 404 };
    }

    const existingSession = sessions[sessionIndex];
    const updateData = body as Partial<Session>;

    // Règle métier: Ne peut pas modifier une session annulée (sauf pour la réactiver)
    if (existingSession.status === 'cancelled' && updateData.status !== 'published') {
      return { ok: false, error: 'Impossible de modifier une session annulée', status: 400 };
    }

    // Règle métier: Si on change la date/heure, elle doit être dans le futur
    if (updateData.dateTime) {
      const newDateTime = new Date(updateData.dateTime);
      if (newDateTime <= new Date()) {
        return { ok: false, error: 'La date/heure doit être dans le futur', status: 400 };
      }
    }

    // Règle métier: Le prix doit être strictement supérieur à 0
    if (updateData.price !== undefined && updateData.price <= 0) {
      return { ok: false, error: 'Le prix doit être strictement supérieur à zéro', status: 400 };
    }

    // Règle métier: Le nombre de karts doit être strictement supérieur à 0
    if (updateData.availableKarts !== undefined && updateData.availableKarts <= 0) {
      return { ok: false, error: 'Le nombre de karts doit être strictement supérieur à zéro', status: 400 };
    }

    // Règle métier: Vérifier le chevauchement si la date/heure ou durée change
    if (updateData.dateTime || updateData.duration) {
      const newDateTime = updateData.dateTime ? new Date(updateData.dateTime) : new Date(existingSession.dateTime);
      const newDuration = updateData.duration || existingSession.duration;

      const hasOverlap = sessions.some(s => {
        if (s.id === id) return false; // Ignorer la session elle-même
        const sStart = new Date(s.dateTime).getTime();
        const sEnd = sStart + s.duration * 60000;
        const newStart = newDateTime.getTime();
        const newEnd = newStart + newDuration * 60000;
        return (newStart >= sStart && newStart < sEnd) || (newEnd > sStart && newEnd <= sEnd) || (newStart <= sStart && newEnd >= sEnd);
      });

      if (hasOverlap) {
        return { ok: false, error: 'Le créneau est déjà occupé par une autre session', status: 409 };
      }
    }

    // Règle métier: Ne peut pas annuler une session si des réservations sont confirmées
    if (updateData.status === 'cancelled') {
      const hasConfirmedBookings = bookings.some(
        b => b.sessionIds.includes(id) && b.status === 'confirmed'
      );
      if (hasConfirmedBookings) {
        return { ok: false, error: 'Impossible d\'annuler une session avec des réservations confirmées', status: 400 };
      }
    }

    // Appliquer les modifications
    const updatedSession: Session = {
      ...existingSession,
      ...updateData,
      dateTime: updateData.dateTime ? new Date(updateData.dateTime) : existingSession.dateTime,
    };

    sessions[sessionIndex] = updatedSession;
    return { ok: true, data: updatedSession as T, status: 200 };
  }

  // ============ BOOKINGS ============

  // GET /bookings
  if (method === 'GET' && url === '/bookings') {
    await delay(300);
    return { ok: true, data: [...bookings] as T, status: 200 };
  }

  // GET /bookings/:id
  if (method === 'GET' && url.startsWith('/bookings/')) {
    await delay(200);
    const id = url.replace('/bookings/', '');
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      return { ok: true, data: booking as T, status: 200 };
    }
    return { ok: false, error: 'Réservation introuvable', status: 404 };
  }

  // POST /bookings
  if (method === 'POST' && url === '/bookings') {
    await delay(500);
    const bookingData = body as { sessionIds: string[]; clientName: string; clientEmail: string };

    if (!bookingData?.sessionIds?.length) {
      return { ok: false, error: 'Au moins une session est requise', status: 400 };
    }
    if (!bookingData.clientName?.trim()) {
      return { ok: false, error: 'Le nom du client est requis', status: 400 };
    }
    if (!bookingData.clientEmail?.includes('@')) {
      return { ok: false, error: 'Une adresse email valide est requise', status: 400 };
    }

    let totalPrice = 0;
    for (const sessionId of bookingData.sessionIds) {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        return { ok: false, error: `La session ${sessionId} n'existe pas`, status: 400 };
      }
      if (session.status !== 'published') {
        return { ok: false, error: `La session ${sessionId} n'est pas disponible`, status: 400 };
      }
      if (new Date(session.dateTime) <= new Date()) {
        return { ok: false, error: `La session ${sessionId} est déjà passée`, status: 400 };
      }
      if (session.availableKarts <= 0) {
        return { ok: false, error: `La session ${sessionId} n'a plus de karts disponibles`, status: 400 };
      }
      totalPrice += session.price;
    }

    const newBooking: Booking = {
      id: generateId('booking'),
      sessionIds: bookingData.sessionIds,
      clientName: bookingData.clientName.trim(),
      clientEmail: bookingData.clientEmail.trim(),
      totalPrice,
      status: 'pending',
      createdAt: new Date(),
    };
    bookings.push(newBooking);
    return { ok: true, data: newBooking as T, status: 201 };
  }

  // PATCH /bookings/:id/status
  if (method === 'PATCH' && url.match(/^\/bookings\/[^/]+\/status$/)) {
    await delay(300);
    const id = url.split('/')[2];
    const { status } = body as { status: Booking['status'] };
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
      return { ok: false, error: 'Réservation introuvable', status: 404 };
    }
    booking.status = status;
    return { ok: true, data: booking as T, status: 200 };
  }

  // ============ PAYMENTS ============

  // GET /payments/:id
  if (method === 'GET' && url.startsWith('/payments/') && !url.includes('booking')) {
    await delay(200);
    const id = url.replace('/payments/', '');
    const payment = payments.find(p => p.id === id);
    if (payment) {
      return { ok: true, data: payment as T, status: 200 };
    }
    return { ok: false, error: 'Paiement introuvable', status: 404 };
  }

  // GET /payments/booking/:bookingId
  if (method === 'GET' && url.startsWith('/payments/booking/')) {
    await delay(200);
    const bookingId = url.replace('/payments/booking/', '');
    const payment = payments.find(p => p.bookingId === bookingId);
    return { ok: true, data: (payment || null) as T, status: 200 };
  }

  // POST /payments
  if (method === 'POST' && url === '/payments') {
    await delay(500);
    const paymentData = body as { bookingId: string; paymentMethod: Payment['paymentMethod'] };

    const booking = bookings.find(b => b.id === paymentData?.bookingId);
    if (!booking) {
      return { ok: false, error: 'Réservation introuvable', status: 404 };
    }
    if (booking.status === 'cancelled') {
      return { ok: false, error: 'Cette réservation a été annulée', status: 400 };
    }

    const existingPayment = payments.find(p => p.bookingId === paymentData.bookingId);
    if (existingPayment?.status === 'completed') {
      return { ok: false, error: 'Cette réservation a déjà été payée', status: 400 };
    }

    const newPayment: Payment = {
      id: generateId('payment'),
      bookingId: paymentData.bookingId,
      amount: booking.totalPrice,
      paymentMethod: paymentData.paymentMethod,
      status: 'pending',
      createdAt: new Date(),
    };
    payments.push(newPayment);
    return { ok: true, data: newPayment as T, status: 201 };
  }

  // POST /payments/:id/process
  if (method === 'POST' && url.match(/^\/payments\/[^/]+\/process$/)) {
    await delay(1000);
    const id = url.split('/')[2];
    const payment = payments.find(p => p.id === id);

    if (!payment) {
      return { ok: false, error: 'Paiement introuvable', status: 404 };
    }
    if (payment.status !== 'pending') {
      return { ok: false, error: `Le paiement est déjà ${payment.status}`, status: 400 };
    }

    // 90% success rate
    const success = Math.random() > 0.1;
    if (success) {
      payment.status = 'completed';
      payment.completedAt = new Date();
      const booking = bookings.find(b => b.id === payment.bookingId);
      if (booking) booking.status = 'confirmed';
    } else {
      payment.status = 'failed';
    }

    return { ok: true, data: payment as T, status: 200 };
  }

  // ============ LEADERBOARD ============

  // GET /leaderboard?limit=10
  if (method === 'GET' && url.startsWith('/leaderboard')) {
    await delay(300);
    const params = new URLSearchParams(url.split('?')[1] || '');
    const limit = parseInt(params.get('limit') || '10', 10);
    const leaderboard = getLeaderboardData(limit);
    return { ok: true, data: leaderboard as T, status: 200 };
  }

  // GET /pilots/:email/stats
  if (method === 'GET' && url.match(/^\/pilots\/[^/]+\/stats$/)) {
    await delay(200);
    const email = decodeURIComponent(url.split('/')[2]);
    const pilotLapTimes = lapTimes.filter(lt => lt.pilotEmail.toLowerCase() === email.toLowerCase());

    if (pilotLapTimes.length === 0) {
      return { ok: true, data: null as T, status: 200 };
    }

    const bestTime = Math.min(...pilotLapTimes.map(lt => lt.lapTimeMs));
    const averageTime = pilotLapTimes.reduce((sum, lt) => sum + lt.lapTimeMs, 0) / pilotLapTimes.length;
    const leaderboard = getLeaderboardData(1000);
    const pilotRank = leaderboard.find(e => e.pilotEmail.toLowerCase() === email.toLowerCase());

    const stats: PilotStats = {
      pilotName: pilotLapTimes[0].pilotName,
      pilotEmail: email.toLowerCase(),
      bestTimeMs: bestTime,
      averageTimeMs: Math.round(averageTime),
      totalSessions: pilotLapTimes.length,
      rank: pilotRank?.rank || 0,
      totalPilots: leaderboard.length,
    };

    return { ok: true, data: stats as T, status: 200 };
  }

  // POST /laptimes
  if (method === 'POST' && url === '/laptimes') {
    await delay(300);
    const lapTimeData = body as { pilotName: string; pilotEmail: string; sessionId: string; lapTimeMs: number };

    if (!lapTimeData?.pilotName?.trim()) {
      return { ok: false, error: 'Le nom du pilote est requis', status: 400 };
    }
    if (!lapTimeData?.pilotEmail?.includes('@')) {
      return { ok: false, error: 'Une adresse email valide est requise', status: 400 };
    }
    if (!lapTimeData?.lapTimeMs || lapTimeData.lapTimeMs <= 0) {
      return { ok: false, error: 'Le temps doit être supérieur à 0', status: 400 };
    }

    const newLapTime: LapTime = {
      id: generateId('laptime'),
      pilotName: lapTimeData.pilotName.trim(),
      pilotEmail: lapTimeData.pilotEmail.trim().toLowerCase(),
      sessionId: lapTimeData.sessionId,
      lapTimeMs: lapTimeData.lapTimeMs,
      recordedAt: new Date(),
    };
    lapTimes.push(newLapTime);
    return { ok: true, data: newLapTime as T, status: 201 };
  }

  // ============ NOT FOUND ============

  return { ok: false, error: `Route not found: ${method} ${url}`, status: 404 };
};

// ============ HELPERS FOR TESTING ============

export const clearFakeSessions = () => { sessions = []; };
export const clearFakeBookings = () => { bookings = []; };
export const clearFakePayments = () => { payments = []; };
export const clearFakeLapTimes = () => { lapTimes = []; };
export const clearAllFakeData = () => {
  sessions = [];
  bookings = [];
  payments = [];
  lapTimes = [];
};
