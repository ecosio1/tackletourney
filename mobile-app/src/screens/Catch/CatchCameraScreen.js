import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { catchAPI } from '../../services/api';

// TODO: Import React Native Camera
// import { RNCamera } from 'react-native-camera';

export default function CatchCameraScreen({ route, navigation }) {
  const { tournament_id } = route.params;
  const [sessionCode, setSessionCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    startCatchSession();
  }, []);

  const startCatchSession = async () => {
    try {
      // Get GPS location
      // TODO: Use React Native Geolocation Service
      const mockGPS = { lat: 27.9506, lon: -82.4572 };

      const response = await catchAPI.startSession(
        tournament_id,
        mockGPS.lat,
        mockGPS.lon
      );

      setSessionCode(response.verification_code);
    } catch (error) {
      console.error('Error starting catch session:', error);
      Alert.alert('Error', 'Failed to start catch session');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    // TODO: Implement camera capture with React Native Camera
    // For now, show placeholder
    Alert.alert(
      'Camera Not Implemented',
      'Camera functionality will be added in Phase 1 completion.\n\nFor now, this would:\n• Capture photo using device camera\n• Include GPS coordinates\n• Display verification code in overlay\n• Prevent gallery uploads',
      [
        {
          text: 'OK',
          onPress: () => {
            // Mock navigation to submit screen
            navigation.navigate('CatchSubmit', {
              tournament_id,
              session_id: 'mock-session',
              photo_uri: 'mock-photo.jpg',
            });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Starting catch session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TODO: Replace with actual camera component */}
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.placeholderText}>Camera View</Text>
        <Text style={styles.placeholderSubtext}>
          React Native Camera will be integrated here
        </Text>
      </View>

      {/* Verification Code Overlay */}
      <View style={styles.overlay}>
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Verification Code:</Text>
          <Text style={styles.codeText}>{sessionCode}</Text>
          <Text style={styles.codeInstruction}>
            Show this code in your photo
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            1. Write code "{sessionCode}" on paper{'\n'}
            2. Place fish on measuring board{'\n'}
            3. Position code in frame where visible{'\n'}
            4. Ensure entire fish is visible{'\n'}
            5. Tap capture button
          </Text>
        </View>
      </View>

      {/* Capture Button */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePhoto}
          disabled={capturing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  placeholderText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  codeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 5,
  },
  codeText: {
    fontSize: 36,
    color: '#4CAF50',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  codeInstruction: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 8,
  },
  instructionTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
