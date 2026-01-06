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

import { useBookSession } from './useBookSession';

export default function BookSessionScreen() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const {
    sessions,
    selectedSessions,
    isLoading,
    isSubmitting,
    error,
    isSuccess,
    loadSessions,
    toggleSessionSelection,
    calculateTotal,
    bookSessions,
  } = useBookSession();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
    }
  }, [error]);

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

    const booking = await bookSessions(clientName, clientEmail);
    if (!booking) return;

    Alert.alert(
      'Réservation créée',
      `Votre réservation a été créée avec succès!\n\nTotal: ${booking.totalPrice.toFixed(
        2
      )}€\n\nSouhaitez-vous procéder au paiement?`,
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
  };

  if (isLoading) {
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

      {isSuccess ? <Text style={styles.successText}>Réservation créée avec succès.</Text> : null}

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
              {isSelected ? <Text style={styles.selectedBadge}>✓ Sélectionnée</Text> : null}
            </TouchableOpacity>
          );
        })
      )}

      {selectedSessions.length > 0 ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé</Text>
          <Text style={styles.summaryText}>
            {selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''}{' '}
            sélectionnée{selectedSessions.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.totalText}>Total: {calculateTotal().toFixed(2)}€</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Informations client</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom *</Text>
        <TextInput
          style={styles.input}
          placeholder="Votre nom"
          value={clientName}
          onChangeText={setClientName}
          editable={!isSubmitting}
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
          editable={!isSubmitting}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (isSubmitting || selectedSessions.length === 0) && styles.buttonDisabled]}
        onPress={handleBookSessions}
        disabled={isSubmitting || selectedSessions.length === 0}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Réservation...' : 'Réserver'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.back()}
        disabled={isSubmitting}
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
  successText: {
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});


