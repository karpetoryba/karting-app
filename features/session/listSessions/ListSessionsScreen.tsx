import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { fakeFetch } from '../../../shared/fakeFetch';
// import { realFetch } from '../../../shared/realFetch'; // Décommenter pour utiliser le vrai fetch
import { useListSessions } from './useListSessions';

export default function ListSessionsScreen() {
  // Injection de dépendance: on passe fakeFetch (ou realFetch pour production)
  const {
    sessions,
    isLoading,
    error,
    loadSessions,
  } = useListSessions({ fetch: fakeFetch });

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publiée';
      case 'draft':
        return 'Brouillon';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'published':
        return styles.statusPublished;
      case 'draft':
        return styles.statusDraft;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return {};
    }
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
      <Text style={styles.title}>Liste des sessions</Text>

      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>Aucune session pour le moment</Text>
      ) : (
        sessions.map(session => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionDateTime}>{formatDateTime(session.dateTime)}</Text>
              <Text style={[styles.statusBadge, getStatusStyle(session.status)]}>
                {getStatusLabel(session.status)}
              </Text>
            </View>
            <Text style={styles.sessionPrice}>{session.price.toFixed(2)}€</Text>
            <Text style={styles.sessionDetails}>
              Durée: {session.duration} min • Karts disponibles: {session.availableKarts}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.back()}
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
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
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
    marginBottom: 5,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusPublished: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  statusDraft: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
  },
  statusCancelled: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
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
