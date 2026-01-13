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

import { formatLapTime, useLeaderboard } from './useLeaderboard';

export default function LeaderboardScreen() {
  const [searchEmail, setSearchEmail] = useState('');

  const {
    leaderboard,
    pilotStats,
    isLoading,
    isLoadingStats,
    error,
    loadLeaderboard,
    loadPilotStats,
    clearPilotStats,
  } = useLeaderboard();

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
    }
  }, [error]);

  const handleSearchStats = () => {
    if (searchEmail && searchEmail.includes('@')) {
      loadPilotStats(searchEmail);
    } else {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
    }
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const getMedalColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Or
      case 2:
        return '#C0C0C0'; // Argent
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#f5f5f5';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement du classement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Classement du Circuit</Text>

      {/* Podium - Top 3 */}
      {leaderboard.length >= 3 && (
        <View style={styles.podiumContainer}>
          {/* 2ème place */}
          <View style={[styles.podiumItem, styles.podiumSecond]}>
            <Text style={styles.podiumMedal}>{getMedalEmoji(2)}</Text>
            <Text style={styles.podiumName}>{leaderboard[1].pilotName}</Text>
            <Text style={styles.podiumTime}>{formatLapTime(leaderboard[1].bestTimeMs)}</Text>
            <View style={[styles.podiumBase, { height: 60, backgroundColor: getMedalColor(2) }]} />
          </View>

          {/* 1ère place */}
          <View style={[styles.podiumItem, styles.podiumFirst]}>
            <Text style={styles.podiumMedal}>{getMedalEmoji(1)}</Text>
            <Text style={styles.podiumName}>{leaderboard[0].pilotName}</Text>
            <Text style={styles.podiumTime}>{formatLapTime(leaderboard[0].bestTimeMs)}</Text>
            <View style={[styles.podiumBase, { height: 80, backgroundColor: getMedalColor(1) }]} />
          </View>

          {/* 3ème place */}
          <View style={[styles.podiumItem, styles.podiumThird]}>
            <Text style={styles.podiumMedal}>{getMedalEmoji(3)}</Text>
            <Text style={styles.podiumName}>{leaderboard[2].pilotName}</Text>
            <Text style={styles.podiumTime}>{formatLapTime(leaderboard[2].bestTimeMs)}</Text>
            <View style={[styles.podiumBase, { height: 40, backgroundColor: getMedalColor(3) }]} />
          </View>
        </View>
      )}

      {/* Liste complète */}
      <Text style={styles.sectionTitle}>Top 10</Text>
      {leaderboard.length === 0 ? (
        <Text style={styles.emptyText}>Aucun temps enregistré pour le moment</Text>
      ) : (
        leaderboard.map((entry, index) => (
          <View
            key={entry.pilotEmail}
            style={[
              styles.leaderboardCard,
              index < 3 && { borderLeftColor: getMedalColor(index + 1), borderLeftWidth: 4 },
            ]}
          >
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>
                {getMedalEmoji(entry.rank) || `#${entry.rank}`}
              </Text>
            </View>
            <View style={styles.pilotInfo}>
              <Text style={styles.pilotName}>{entry.pilotName}</Text>
              <Text style={styles.pilotSessions}>{entry.totalSessions} session(s)</Text>
            </View>
            <Text style={styles.lapTime}>{formatLapTime(entry.bestTimeMs)}</Text>
          </View>
        ))
      )}

      {/* Recherche de stats personnelles */}
      <Text style={styles.sectionTitle}>Mes Statistiques</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Entrez votre email"
          value={searchEmail}
          onChangeText={setSearchEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchStats}
          disabled={isLoadingStats}
        >
          {isLoadingStats ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Rechercher</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats du pilote */}
      {pilotStats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>{pilotStats.pilotName}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Classement</Text>
              <Text style={styles.statValue}>
                {pilotStats.rank}/{pilotStats.totalPilots}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Meilleur temps</Text>
              <Text style={[styles.statValue, styles.statValueHighlight]}>
                {formatLapTime(pilotStats.bestTimeMs)}
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Temps moyen</Text>
              <Text style={styles.statValue}>{formatLapTime(pilotStats.averageTimeMs)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statValue}>{pilotStats.totalSessions}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearPilotStats}>
            <Text style={styles.clearButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}

      {pilotStats === null && searchEmail && !isLoadingStats && (
        <Text style={styles.noStatsText}>
          Aucune statistique trouvée pour cet email. Participez à une session pour apparaître au classement !
        </Text>
      )}

      {/* Bouton retour */}
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
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 15,
    color: '#333',
  },

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 20,
    height: 180,
  },
  podiumItem: {
    alignItems: 'center',
    width: 100,
    marginHorizontal: 5,
  },
  podiumFirst: {},
  podiumSecond: {},
  podiumThird: {},
  podiumMedal: {
    fontSize: 32,
    marginBottom: 5,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  podiumTime: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  podiumBase: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },

  // Leaderboard list
  leaderboardCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pilotInfo: {
    flex: 1,
    marginLeft: 10,
  },
  pilotName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pilotSessions: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  lapTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Stats card
  statsCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statValueHighlight: {
    color: '#007AFF',
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
  },
  noStatsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 10,
  },

  // Buttons
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
