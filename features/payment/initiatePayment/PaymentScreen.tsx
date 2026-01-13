import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { fakeFetch, LapTime } from '../../../shared/fakeFetch';
// import { realFetch } from '../../../shared/realFetch'; // Décommenter pour utiliser le vrai fetch
import { usePayment } from './usePayment';

// Convertir millisecondes en format MM:SS.mmm
function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Parser un temps au format MM:SS.mmm en millisecondes
function parseLapTime(timeStr: string): number | null {
  const regex = /^(\d{1,2}):(\d{2})\.(\d{3})$/;
  const match = timeStr.trim().match(regex);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const milliseconds = parseInt(match[3], 10);
  if (seconds >= 60) return null;
  return minutes * 60000 + seconds * 1000 + milliseconds;
}

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'other'>('card');
  const [lapTimeInput, setLapTimeInput] = useState('');
  const [isRecordingLapTime, setIsRecordingLapTime] = useState(false);
  const [lapTimeRecorded, setLapTimeRecorded] = useState(false);
  const [recordedTime, setRecordedTime] = useState<number | null>(null);

  // Injection de dépendance: on passe fakeFetch (ou realFetch pour production)
  const {
    booking,
    payment,
    isLoading,
    isProcessing,
    error,
    isSuccess,
    initiatePayment,
  } = usePayment({ fetch: fakeFetch, bookingId });

  useEffect(() => {
    if (!bookingId) {
      Alert.alert('Erreur', 'Aucune réservation spécifiée', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [bookingId]);

  useEffect(() => {
    if (error && !isLoading) {
      Alert.alert('Erreur', error);
    }
  }, [error, isLoading]);

  const handleRecordLapTime = async () => {
    if (!booking) return;

    const timeMs = parseLapTime(lapTimeInput);
    if (!timeMs) {
      Alert.alert('Format invalide', 'Le format attendu est M:SS.mmm (ex: 1:23.456)');
      return;
    }

    setIsRecordingLapTime(true);
    try {
      const response = await fakeFetch<LapTime>('/laptimes', {
        method: 'POST',
        body: {
          pilotName: booking.clientName,
          pilotEmail: booking.clientEmail,
          sessionId: booking.sessionIds[0],
          lapTimeMs: timeMs,
        },
      });

      if (response.ok) {
        setLapTimeRecorded(true);
        setRecordedTime(timeMs);
        Alert.alert(
          'Temps enregistré !',
          `Votre temps de ${formatLapTime(timeMs)} a été enregistré. Consultez le classement pour voir votre position !`
        );
      } else {
        Alert.alert('Erreur', response.error || "Impossible d'enregistrer le temps");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Impossible d'enregistrer le temps";
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsRecordingLapTime(false);
    }
  };

  const handleInitiatePayment = async () => {
    const result = await initiatePayment(paymentMethod);
    if (!result && payment?.status === 'failed') {
      Alert.alert(
        'Paiement échoué',
        "Le paiement n'a pas pu être traité. Veuillez réessayer.",
        [
          {
            text: 'Réessayer',
            onPress: () => {},
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Réservation introuvable</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPaymentCompleted = payment?.status === 'completed';
  const isPaymentPending = payment?.status === 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Paiement</Text>

      <View style={styles.bookingCard}>
        <Text style={styles.cardTitle}>Détails de la réservation</Text>
        <Text style={styles.bookingInfo}>Client: {booking.clientName}</Text>
        <Text style={styles.bookingInfo}>Email: {booking.clientEmail}</Text>
        <Text style={styles.bookingInfo}>
          Nombre de sessions: {booking.sessionIds.length}
        </Text>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Montant total:</Text>
          <Text style={styles.amountValue}>{booking.totalPrice.toFixed(2)}€</Text>
        </View>
      </View>

      {isPaymentCompleted ? (
        <>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Paiement effectué</Text>
            <Text style={styles.successText}>
              Votre réservation est confirmée. Vous recevrez un email de confirmation.
            </Text>
            <Text style={styles.paymentInfo}>ID de paiement: {payment?.id}</Text>
            <Text style={styles.paymentInfo}>
              Date: {payment?.completedAt ? formatDateTime(payment.completedAt) : ''}
            </Text>
          </View>

          {/* Formulaire de saisie du chrono */}
          <View style={styles.lapTimeCard}>
            <Text style={styles.lapTimeTitle}>Enregistrez votre chrono !</Text>
            <Text style={styles.lapTimeDescription}>
              Saisissez votre meilleur temps au tour pour apparaître dans le classement.
            </Text>

            {lapTimeRecorded && recordedTime ? (
              <View style={styles.lapTimeRecordedContainer}>
                <Text style={styles.lapTimeRecordedLabel}>Temps enregistré :</Text>
                <Text style={styles.lapTimeRecordedValue}>{formatLapTime(recordedTime)}</Text>
                <TouchableOpacity
                  style={styles.viewLeaderboardButton}
                  onPress={() => router.push('/leaderboard')}
                >
                  <Text style={styles.viewLeaderboardButtonText}>Voir le classement</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.lapTimeInputContainer}>
                  <TextInput
                    style={styles.lapTimeInput}
                    placeholder="1:23.456"
                    value={lapTimeInput}
                    onChangeText={setLapTimeInput}
                    keyboardType="numbers-and-punctuation"
                    editable={!isRecordingLapTime}
                  />
                  <Text style={styles.lapTimeFormat}>Format: M:SS.mmm</Text>
                </View>

                <TouchableOpacity
                  style={[styles.lapTimeButton, isRecordingLapTime && styles.buttonDisabled]}
                  onPress={handleRecordLapTime}
                  disabled={isRecordingLapTime || !lapTimeInput}
                >
                  {isRecordingLapTime ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.lapTimeButtonText}>Enregistrer mon temps</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.skipButtonText}>Passer cette étape</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Méthode de paiement</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === 'card' && styles.paymentMethodButtonSelected,
              ]}
              onPress={() => setPaymentMethod('card')}
              disabled={isProcessing || isPaymentPending}
            >
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentMethod === 'card' && styles.paymentMethodTextSelected,
                ]}
              >
                Carte bancaire
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === 'cash' && styles.paymentMethodButtonSelected,
              ]}
              onPress={() => setPaymentMethod('cash')}
              disabled={isProcessing || isPaymentPending}
            >
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentMethod === 'cash' && styles.paymentMethodTextSelected,
                ]}
              >
                Espèces
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === 'other' && styles.paymentMethodButtonSelected,
              ]}
              onPress={() => setPaymentMethod('other')}
              disabled={isProcessing || isPaymentPending}
            >
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentMethod === 'other' && styles.paymentMethodTextSelected,
                ]}
              >
                Autre
              </Text>
            </TouchableOpacity>
          </View>

          {isPaymentPending ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Un paiement est en cours de traitement pour cette réservation.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, (isProcessing || isPaymentPending) && styles.buttonDisabled]}
            onPress={handleInitiatePayment}
            disabled={isProcessing || isPaymentPending}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Payer {booking.totalPrice.toFixed(2)}€</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.back()}
        disabled={isProcessing}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
          {isPaymentCompleted ? "Retour à l'accueil" : 'Annuler'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  bookingInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  paymentMethodButton: {
    flex: 1,
    minWidth: 100,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  paymentMethodButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  paymentMethodTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  paymentInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007AFF',
  },

  // Lap time styles
  lapTimeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  lapTimeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  lapTimeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  lapTimeInputContainer: {
    marginBottom: 15,
  },
  lapTimeInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  lapTimeFormat: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  lapTimeButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  lapTimeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
  lapTimeRecordedContainer: {
    alignItems: 'center',
  },
  lapTimeRecordedLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  lapTimeRecordedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 15,
  },
  viewLeaderboardButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  viewLeaderboardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


