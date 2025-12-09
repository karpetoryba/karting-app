// Fake API service for bookings

import { Session, sessionApi } from './sessionApi';

export interface Booking {
  id: string;
  sessionIds: string[]; // Multiple sessions can be booked
  clientName: string;
  clientEmail: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
}

// In-memory storage (simulating a database)
let bookings: Booking[] = [];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const bookingApi = {
  // Create a new booking
  async createBooking(
    sessionIds: string[],
    clientName: string,
    clientEmail: string
  ): Promise<Booking> {
    await delay(500);

    // Validate sessions exist and are available
    const sessions: Session[] = [];
    let totalPrice = 0;

    for (const sessionId of sessionIds) {
      const session = await sessionApi.getSessionById(sessionId);
      if (!session) {
        throw new Error(`La session ${sessionId} n'existe pas`);
      }

      if (session.status !== 'published') {
        throw new Error(`La session ${sessionId} n'est pas disponible à la réservation`);
      }

      if (new Date(session.dateTime) <= new Date()) {
        throw new Error(`La session ${sessionId} est déjà passée`);
      }

      if (session.availableKarts <= 0) {
        throw new Error(`La session ${sessionId} n'a plus de karts disponibles`);
      }

      sessions.push(session);
      totalPrice += session.price;
    }

    // Validate client information
    if (!clientName || clientName.trim().length === 0) {
      throw new Error('Le nom du client est requis');
    }

    if (!clientEmail || !clientEmail.includes('@')) {
      throw new Error('Une adresse email valide est requise');
    }

    // Create booking
    const newBooking: Booking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionIds,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      totalPrice,
      status: 'pending',
      createdAt: new Date(),
    };

    bookings.push(newBooking);
    return newBooking;
  },

  // Get booking by ID
  async getBookingById(id: string): Promise<Booking | null> {
    await delay(200);
    return bookings.find(b => b.id === id) || null;
  },

  // Get all bookings (for future use)
  async getBookings(): Promise<Booking[]> {
    await delay(300);
    return [...bookings];
  },

  // Update booking status
  async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    await delay(300);
    const booking = bookings.find(b => b.id === id);
    if (!booking) {
      throw new Error('Réservation introuvable');
    }
    booking.status = status;
    return booking;
  },

  // Clear all bookings (for testing)
  clearBookings() {
    bookings = [];
  },
};

