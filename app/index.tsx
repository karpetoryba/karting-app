import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Karting App</Text>
      <Text style={styles.subtitle}>Gestion des sessions</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/create-session")}
        >
          <Text style={styles.buttonText}>Créer une session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonStaffSecondary]}
          onPress={() => router.push("/list-sessions")}
        >
          <Text style={styles.buttonText}>Voir les sessions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonClient]}
          onPress={() => router.push("/book-session")}
        >
          <Text style={styles.buttonText}>Réserver une session</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classement</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonLeaderboard]}
          onPress={() => router.push("/leaderboard")}
        >
          <Text style={[styles.buttonText, styles.buttonTextDark]}>Voir le classement</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 40,
  },
  section: {
    width: "100%",
    marginBottom: 30,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  buttonClient: {
    backgroundColor: "#4caf50",
  },
  buttonLeaderboard: {
    backgroundColor: "#FFD700",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonStaffSecondary: {
    backgroundColor: "#0056b3",
    marginTop: 10,
  },
  buttonTextDark: {
    color: "#333",
  },
});
