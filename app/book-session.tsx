import { router } from 'expo-router';
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
import { bookingApi } from '../services/bookingApi';
import { Session, sessionApi } from '../services/sessionApi';

export default function BookSessionScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const publishedSessions = await sessionApi.getPublishedSessions();
      setSessions(publishedSessions);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les sessions disponibles');
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      } else {
        return [...prev, sessionId];
      }
    });
  };

  const calculateTotal = () => {
    return selectedSessions.reduce((total, sessionId) => {
      const session = sessions.find(s => s.id === sessionId);
      return total + (session?.price || 0);
    }, 0);
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

  const handleBookSessions = async () => {
    if (selectedSessions.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une session');
      return;
    }

    if (!clientName || clientName.trim().length === 0) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    if (!clientEmail || !clientEmail.includes('@')) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    setSubmitting(true);

    try {
      const booking = await bookingApi.createBooking(
        selectedSessions,
        clientName,
        clientEmail
      );

      Alert.alert(
        'Réservation créée',
        `Votre réservation a été créée avec succès!\n\nTotal: ${booking.totalPrice.toFixed(2)}€\n\nSouhaitez-vous procéder au paiement?`,
        [
          {
            text: 'Plus tard',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Payer maintenant',
            onPress: () => router.push(`/payment?bookingId=${booking.id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des sessions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Réserver une session</Text>

      <Text style={styles.sectionTitle}>Sessions disponibles</Text>
      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>Aucune session disponible pour le moment</Text>
      ) : (
        sessions.map(session => {
          const isSelected = selectedSessions.includes(session.id);
          return (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, isSelected && styles.sessionCardSelected]}
              onPress={() => toggleSessionSelection(session.id)}
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDateTime}>{formatDateTime(session.dateTime)}</Text>
                <Text style={styles.sessionPrice}>{session.price.toFixed(2)}€</Text>
              </View>
              <Text style={styles.sessionDetails}>
                Durée: {session.duration} min • Karts disponibles: {session.availableKarts}
              </Text>
              {isSelected && (
                <Text style={styles.selectedBadge}>✓ Sélectionnée</Text>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {selectedSessions.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <Text style={styles.summaryText}>
            {selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''} sélectionnée{selectedSessions.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.totalText}>Total: {calculateTotal().toFixed(2)}€</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Informations client</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom *</Text>
        <TextInput
          style={styles.input}
          placeholder="Votre nom"
          value={clientName}
          onChangeText={setClientName}
          editable={!submitting}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="votre.email@example.com"
          value={clientEmail}
          onChangeText={setClientEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!submitting}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (submitting || selectedSessions.length === 0) && styles.buttonDisabled]}
        onPress={handleBookSessions}
        disabled={submitting || selectedSessions.length === 0}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'Réservation...' : 'Réserver'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.back()}
        disabled={submitting}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Annuler</Text>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  sessionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDateTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sessionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sessionDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  selectedBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
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
});

