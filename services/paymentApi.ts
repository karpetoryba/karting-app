// Fake API service for payments

import { bookingApi } from './bookingApi';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: 'card' | 'cash' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  completedAt?: Date;
}

// In-memory storage (simulating a database)
let payments: Payment[] = [];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const paymentApi = {
  // Initiate a payment
  async initiatePayment(
    bookingId: string,
    paymentMethod: Payment['paymentMethod']
  ): Promise<Payment> {
    await delay(500);

    // Get booking
    const booking = await bookingApi.getBookingById(bookingId);
    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Cette réservation a été annulée');
    }

    // Check if payment already exists
    const existingPayment = payments.find(p => p.bookingId === bookingId);
    if (existingPayment && existingPayment.status === 'completed') {
      throw new Error('Cette réservation a déjà été payée');
    }

    // Create payment
    const newPayment: Payment = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bookingId,
      amount: booking.totalPrice,
      paymentMethod,
      status: 'pending',
      createdAt: new Date(),
    };

    payments.push(newPayment);
    return newPayment;
  },

  // Process payment (simulate payment processing)
  async processPayment(paymentId: string): Promise<Payment> {
    await delay(1000); // Simulate payment processing time

    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Paiement introuvable');
    }

    if (payment.status !== 'pending') {
      throw new Error(`Le paiement est déjà ${payment.status}`);
    }

    // Simulate payment success (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      payment.status = 'completed';
      payment.completedAt = new Date();
      // Update booking status
      await bookingApi.updateBookingStatus(payment.bookingId, 'confirmed');
    } else {
      payment.status = 'failed';
    }

    return payment;
  },

  // Get payment by ID
  async getPaymentById(id: string): Promise<Payment | null> {
    await delay(200);
    return payments.find(p => p.id === id) || null;
  },

  // Get payment by booking ID
  async getPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    await delay(200);
    return payments.find(p => p.bookingId === bookingId) || null;
  },

  // Get all payments (for future use)
  async getPayments(): Promise<Payment[]> {
    await delay(300);
    return [...payments];
  },

  // Clear all payments (for testing)
  clearPayments() {
    payments = [];
  },
};


