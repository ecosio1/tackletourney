import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CatchSubmitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Catch Submit Screen - To Be Implemented</Text>
      <Text style={styles.subtext}>Review photo, enter details, submit catch</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, color: '#333', marginBottom: 10 },
  subtext: { fontSize: 14, color: '#999' },
});
