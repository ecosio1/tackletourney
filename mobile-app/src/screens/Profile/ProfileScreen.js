import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen - To Be Implemented</Text>
      <Text style={styles.subtext}>User stats, settings, wallet, catch history</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, color: '#333', marginBottom: 10 },
  subtext: { fontSize: 14, color: '#999' },
});
