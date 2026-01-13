import { useEffect, useState } from 'react';

import { FetchInterface } from '../../../shared/fetch';
import { Booking, Payment } from '../../../shared/fakeFetch';

type PaymentMethod = 'card' | 'cash' | 'other';

interface UsePaymentProps {
  fetch: FetchInterface;
  bookingId: string | undefined;
}

export function usePayment({ fetch, bookingId }: UsePaymentProps) {
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
      // Load booking
      const bookingResponse = await fetch<Booking>(`/bookings/${bookingId}`, { method: 'GET' });
      if (!bookingResponse.ok || !bookingResponse.data) {
        setError(bookingResponse.error || 'Réservation introuvable');
        return;
      }
      setBooking(bookingResponse.data);

      // Check for existing payment
      const paymentResponse = await fetch<Payment | null>(`/payments/booking/${bookingId}`, { method: 'GET' });
      if (paymentResponse.ok && paymentResponse.data) {
        setPayment(paymentResponse.data);
        if (paymentResponse.data.status === 'completed') {
          setIsSuccess(true);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de charger la réservation';
      setError(errorMessage);
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
      // Create payment
      const createResponse = await fetch<Payment>('/payments', {
        method: 'POST',
        body: { bookingId, paymentMethod },
      });

      if (!createResponse.ok || !createResponse.data) {
        setError(createResponse.error || 'Impossible de créer le paiement');
        return null;
      }

      setPayment(createResponse.data);

      // Process payment
      const processResponse = await fetch<Payment>(`/payments/${createResponse.data.id}/process`, {
        method: 'POST',
      });

      if (!processResponse.ok || !processResponse.data) {
        setError(processResponse.error || 'Impossible de traiter le paiement');
        return null;
      }

      setPayment(processResponse.data);

      if (processResponse.data.status === 'completed') {
        setIsSuccess(true);
        return processResponse.data;
      } else {
        setError("Le paiement n'a pas pu être traité. Veuillez réessayer.");
        return null;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors du paiement';
      setError(errorMessage);
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
