import { useEffect, useState } from 'react';

import { Booking, bookingApi } from '../../../services/bookingApi';
import { Payment, paymentApi } from '../../../services/paymentApi';

type PaymentMethod = 'card' | 'cash' | 'other';

export function usePayment(bookingId: string | undefined) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    setError(null);

    try {
      const bookingData = await bookingApi.getBookingById(bookingId);
      if (!bookingData) {
        setError('Réservation introuvable');
        return;
      }

      setBooking(bookingData);

      const existingPayment = await paymentApi.getPaymentByBookingId(bookingId);
      if (existingPayment) {
        setPayment(existingPayment);
        if (existingPayment.status === 'completed') {
          setIsSuccess(true);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger la réservation');
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayment = async (paymentMethod: PaymentMethod) => {
    if (!bookingId) {
      setError('Aucune réservation spécifiée');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setIsSuccess(false);

    try {
      const newPayment = await paymentApi.initiatePayment(bookingId, paymentMethod);
      setPayment(newPayment);

      const processedPayment = await paymentApi.processPayment(newPayment.id);
      setPayment(processedPayment);

      if (processedPayment.status === 'completed') {
        setIsSuccess(true);
        return processedPayment;
      } else {
        setError("Le paiement n'a pas pu être traité. Veuillez réessayer.");
        return null;
      }
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue lors du paiement');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    booking,
    payment,
    isLoading,
    isProcessing,
    error,
    isSuccess,
    initiatePayment,
    reloadBooking: loadBooking,
  };
}
import { useEffect, useState } from 'react';

import { Booking, bookingApi } from '../../../services/bookingApi';
import { Payment, paymentApi } from '../../../services/paymentApi';

type PaymentMethod = 'card' | 'cash' | 'other';

export function usePayment(bookingId: string | undefined) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load booking and existing payment
  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    if (!bookingId) return;

    setIsLoading(true);
    setError(null);

    try {
      const bookingData = await bookingApi.getBookingById(bookingId);
      if (!bookingData) {
        setError('Réservation introuvable');
        return;
      }

      setBooking(bookingData);

      // Check if payment already exists
      const existingPayment = await paymentApi.getPaymentByBookingId(bookingId);
      if (existingPayment) {
        setPayment(existingPayment);
        if (existingPayment.status === 'completed') {
          setIsSuccess(true);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger la réservation');
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePayment = async (paymentMethod: PaymentMethod) => {
    if (!bookingId) {
      setError('Aucune réservation spécifiée');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Initiate payment
      const newPayment = await paymentApi.initiatePayment(bookingId, paymentMethod);
      setPayment(newPayment);

      // Process payment
      const processedPayment = await paymentApi.processPayment(newPayment.id);
      setPayment(processedPayment);

      if (processedPayment.status === 'completed') {
        setIsSuccess(true);
        return processedPayment;
      } else {
        setError('Le paiement n\'a pas pu être traité. Veuillez réessayer.');
        return null;
      }
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue lors du paiement');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    booking,
    payment,
    isLoading,
    isProcessing,
    error,
    isSuccess,
    initiatePayment,
    reloadBooking: loadBooking,
  };
}

