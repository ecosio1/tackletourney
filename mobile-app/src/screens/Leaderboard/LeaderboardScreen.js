import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Leaderboard Screen - To Be Implemented</Text>
      <Text style={styles.subtext}>Global and tournament-specific rankings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, color: '#333', marginBottom: 10 },
  subtext: { fontSize: 14, color: '#999' },
});
