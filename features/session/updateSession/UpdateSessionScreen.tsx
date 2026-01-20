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

import { fakeFetch } from '../../../shared/fakeFetch';
// import { realFetch } from '../../../shared/realFetch'; // Décommenter pour utiliser le vrai fetch
import { useUpdateSession } from './useUpdateSession';

export default function UpdateSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [dateTime, setDateTime] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [availableKarts, setAvailableKarts] = useState('');
  const [price, setPrice] = useState('');

  // Injection de dépendance: on passe fakeFetch (ou realFetch pour production)
  const {
    session,
    isLoading,
    isUpdating,
    error,
    isSuccess,
    loadSession,
    updateSession,
    cancelSession,
  } = useUpdateSession({ fetch: fakeFetch });

  // Charger la session au montage
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      Alert.alert('Erreur', 'Aucune session spécifiée', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [sessionId, loadSession]);

  // Pré-remplir le formulaire avec les données de la session
  useEffect(() => {
    if (session) {
      const sessionDate = new Date(session.dateTime);
      setDateTime(sessionDate.toISOString().split('T')[0]); // YYYY-MM-DD
      setTime(sessionDate.toTimeString().slice(0, 5)); // HH:MM
      setDuration(session.duration.toString());
      setAvailableKarts(session.availableKarts.toString());
      setPrice(session.price.toString());
    }
  }, [session]);

  useEffect(() => {
    if (error && !isLoading) {
      Alert.alert('Erreur', error);
    }
  }, [error, isLoading]);

  const handleUpdateSession = async () => {
    if (!sessionId) return;

    if (!dateTime || !time || !duration || !availableKarts || !price) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const durationNum = parseInt(duration, 10);
    const kartsNum = parseInt(availableKarts, 10);
    const priceNum = parseFloat(price);

    // Règle métier: La durée doit être supérieure à 0
    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Erreur', 'La durée doit être un nombre supérieur à 0');
      return;
    }

    // Règle métier: Le nombre de karts doit être strictement supérieur à 0
    if (isNaN(kartsNum) || kartsNum <= 0) {
      Alert.alert('Erreur', 'Le nombre de karts doit être strictement supérieur à zéro');
      return;
    }

    // Règle métier: Le prix doit être strictement supérieur à 0
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Erreur', 'Le prix doit être strictement supérieur à zéro');
      return;
    }

    const dateTimeString = `${dateTime}T${time}`;
    const sessionDateTime = new Date(dateTimeString);

    if (isNaN(sessionDateTime.getTime())) {
      Alert.alert('Erreur', 'Date ou heure invalide');
      return;
    }

    // Règle métier: La date/heure doit être dans le futur
    const now = new Date();
    if (sessionDateTime <= now) {
      Alert.alert('Erreur', 'La date/heure doit être dans le futur');
      return;
    }

    const updatedSession = await updateSession(sessionId, {
      dateTime: sessionDateTime,
      duration: durationNum,
      availableKarts: kartsNum,
      price: priceNum,
    });

    if (!updatedSession) return;

    Alert.alert(
      'Succès',
      `Session mise à jour avec succès!\nID: ${updatedSession.id}`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleCancelSession = async () => {
    if (!sessionId) return;

    // Règle métier: Confirmation avant annulation
    Alert.alert(
      'Confirmer l\'annulation',
      'Êtes-vous sûr de vouloir annuler cette session ? Cette action est irréversible.',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            const cancelled = await cancelSession(sessionId);
            if (cancelled) {
              Alert.alert('Session annulée', 'La session a été annulée avec succès.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement de la session...</Text>
      </View>
    );
  }

  if (!session && !isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Session introuvable</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCancelled = session?.status === 'cancelled';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Modifier la session</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isSuccess ? <Text style={styles.successText}>Session mise à jour avec succès.</Text> : null}

      {isCancelled ? (
        <View style={styles.cancelledBanner}>
          <Text style={styles.cancelledText}>Cette session a été annulée</Text>
        </View>
      ) : null}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={[styles.input, isCancelled && styles.inputDisabled]}
          placeholder="YYYY-MM-DD"
          value={dateTime}
          onChangeText={setDateTime}
          editable={!isUpdating && !isCancelled}
        />
        <Text style={styles.hint}>Format: YYYY-MM-DD (ex: 2025-12-25)</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Heure *</Text>
        <TextInput
          style={[styles.input, isCancelled && styles.inputDisabled]}
          placeholder="HH:MM"
          value={time}
          onChangeText={setTime}
          editable={!isUpdating && !isCancelled}
        />
        <Text style={styles.hint}>Format: HH:MM (ex: 14:30)</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Durée (minutes) *</Text>
        <TextInput
          style={[styles.input, isCancelled && styles.inputDisabled]}
          placeholder="60"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          editable={!isUpdating && !isCancelled}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre de karts disponibles *</Text>
        <TextInput
          style={[styles.input, isCancelled && styles.inputDisabled]}
          placeholder="10"
          value={availableKarts}
          onChangeText={setAvailableKarts}
          keyboardType="numeric"
          editable={!isUpdating && !isCancelled}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prix (€) *</Text>
        <TextInput
          style={[styles.input, isCancelled && styles.inputDisabled]}
          placeholder="50.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          editable={!isUpdating && !isCancelled}
        />
      </View>

      {!isCancelled ? (
        <>
          <TouchableOpacity
            style={[styles.button, isUpdating && styles.buttonDisabled]}
            onPress={handleUpdateSession}
            disabled={isUpdating}
          >
            <Text style={styles.buttonText}>
              {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger, isUpdating && styles.buttonDisabled]}
            onPress={handleCancelSession}
            disabled={isUpdating}
          >
            <Text style={styles.buttonText}>Annuler la session</Text>
          </TouchableOpacity>
        </>
      ) : null}

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.back()}
        disabled={isUpdating}
      >
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Retour</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
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
  inputDisabled: {
    backgroundColor: '#e0e0e0',
    color: '#999',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  buttonDanger: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007AFF',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  successText: {
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelledBanner: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  cancelledText: {
    color: '#d32f2f',
    fontWeight: '600',
    textAlign: 'center',
  },
});
