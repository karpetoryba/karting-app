import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCreateSession } from './useCreateSession';

export default function CreateSessionScreen() {
  const [dateTime, setDateTime] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [availableKarts, setAvailableKarts] = useState('');
  const [price, setPrice] = useState('');

  const { createSession, isLoading, error, isSuccess } = useCreateSession();

  const handleCreateSession = async () => {
    if (!dateTime || !time || !duration || !availableKarts || !price) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const durationNum = parseInt(duration, 10);
    const kartsNum = parseInt(availableKarts, 10);
    const priceNum = parseFloat(price);

    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Erreur', 'La durée doit être un nombre supérieur à 0');
      return;
    }

    if (isNaN(kartsNum) || kartsNum <= 0) {
      Alert.alert('Erreur', 'Le nombre de karts doit être strictement supérieur à zéro');
      return;
    }

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

    const now = new Date();
    if (sessionDateTime <= now) {
      Alert.alert('Erreur', 'La date/heure doit être dans le futur');
      return;
    }

    const newSession = await createSession({
      dateTime: sessionDateTime,
      duration: durationNum,
      availableKarts: kartsNum,
      price: priceNum,
    });

    if (!newSession) return;

    Alert.alert(
      'Succès',
      `Session créée avec succès!\nID: ${newSession.id}\nStatut: ${newSession.status}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setDateTime('');
            setTime('');
            setDuration('');
            setAvailableKarts('');
            setPrice('');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Créer une session</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {isSuccess ? <Text style={styles.successText}>Session créée et publiée avec succès.</Text> : null}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={dateTime}
          onChangeText={setDateTime}
          editable={!isLoading}
        />
        <Text style={styles.hint}>Format: YYYY-MM-DD (ex: 2025-12-25)</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Heure *</Text>
        <TextInput
          style={styles.input}
          placeholder="HH:MM"
          value={time}
          onChangeText={setTime}
          editable={!isLoading}
        />
        <Text style={styles.hint}>Format: HH:MM (ex: 14:30)</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Durée (minutes) *</Text>
        <TextInput
          style={styles.input}
          placeholder="60"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          editable={!isLoading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre de karts disponibles *</Text>
        <TextInput
          style={styles.input}
          placeholder="10"
          value={availableKarts}
          onChangeText={setAvailableKarts}
          keyboardType="numeric"
          editable={!isLoading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prix (€) *</Text>
        <TextInput
          style={styles.input}
          placeholder="50.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreateSession}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Création...' : 'Créer la session'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.back()}
        disabled={isLoading}
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
});

