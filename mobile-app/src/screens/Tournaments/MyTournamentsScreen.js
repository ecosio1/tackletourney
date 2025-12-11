import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyTournamentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Tournaments Screen - To Be Implemented</Text>
      <Text style={styles.subtext}>Active and completed tournaments user has joined</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, color: '#333', marginBottom: 10 },
  subtext: { fontSize: 14, color: '#999' },
});
