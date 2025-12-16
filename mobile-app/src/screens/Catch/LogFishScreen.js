import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import useUserLocation from '../../hooks/useUserLocation';
import {
  checkLocationAllowedForTournament,
  describeBoundary,
} from '../../utils/location-boundary';
import { tournamentAPI } from '../../services/api';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SectionHeader from '../../components/ui/SectionHeader';
import Banner from '../../components/ui/Banner';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import { useCatches } from '../../state/catches-context';
import { analyzeCatchPhoto } from '../../services/measurement-service';
import { canSubmitForPrizes } from '../../utils/tournament-validation';

const STEPS = {
  INSTRUCTIONS: 'INSTRUCTIONS',
  CAPTURE: 'CAPTURE',
  CONFIRM: 'CONFIRM',
};

function getLocationBlockMessage(status) {
  if (!status || status.allowed) {
    return null;
  }

  if (status.reason === 'OUTSIDE_STATE') {
    return 'You are outside the allowed state boundary for this tournament.';
  }
  if (status.reason === 'OUTSIDE_REGION') {
    return 'You are outside the allowed region for this tournament.';
  }
  if (status.reason === 'OUTSIDE_BOUNDARY') {
    const distance = Number(status.distanceKm);
    const permitted = Number(status.permittedRadiusKm);
    if (Number.isFinite(distance) && Number.isFinite(permitted)) {
      return `You are outside the allowed radius (${distance.toFixed(2)} km away; allowed ${permitted.toFixed(2)} km).`;
    }
    return 'You are outside the allowed radius boundary for this tournament.';
  }

  if (status.reason === 'LOCATION_UNKNOWN') {
    return 'Location unavailable. Please enable location services and try again.';
  }

  return 'Location check failed. Please try again.';
}

function getMockPhotoUri(tournamentId) {
  return `https://picsum.photos/seed/tackletourney-${encodeURIComponent(
    tournamentId ?? 'catch'
  )}/900/1200`;
}

export default function LogFishScreen({ route, navigation }) {
  const { tournamentId, onCatchSubmitted } = route.params ?? {};

  const { location, locationLabel, currentState, regionLabel } = useUserLocation();
  const { submitCatch } = useCatches();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState({
    allowed: false,
    reason: 'LOADING',
  });
  const [lengthInches, setLengthInches] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [step, setStep] = useState(STEPS.INSTRUCTIONS);
  const [measurement, setMeasurement] = useState({
    status: 'idle',
    version: 'roboflow-v1',
    measuredLengthIn: null,
    confidence: 0,
    flags: [],
    startedAt: null,
    completedAt: null,
      referenceObject: null,
    referenceObject: null,
  });
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const cameraRef = React.useRef(null);

  const boundaryDescription = useMemo(
    () => describeBoundary(tournament),
    [tournament]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchTournament = async () => {
      setLoading(true);
      try {
        const data = await tournamentAPI.getTournamentById(tournamentId);
        if (isMounted) {
          setTournament(data);
        }
      } catch (error) {
        console.error('Unable to load tournament for log flow', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTournament();

    return () => {
      isMounted = false;
    };
  }, [tournamentId]);

  useEffect(() => {
    if (!tournament || !location) {
      return;
    }

    const status = checkLocationAllowedForTournament(tournament, {
      ...location,
      state: currentState,
      regionName: regionLabel,
    });
    setLocationStatus(status);
  }, [tournament, location, currentState, regionLabel]);

  useEffect(() => {
    if (!tournament) {
      return;
    }

    if (!selectedSpecies && Array.isArray(tournament.species) && tournament.species.length) {
      setSelectedSpecies(tournament.species[0]);
    }
  }, [tournament, selectedSpecies]);

  useEffect(() => {
    if (step !== STEPS.CAPTURE || Platform.OS === 'web') {
      return;
    }

    if (!cameraPermission) {
      return;
    }

    if (!cameraPermission.granted) {
      requestCameraPermission();
    }
  }, [step, cameraPermission, requestCameraPermission]);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!photoUri) {
        setMeasurement((prev) => ({ ...prev, status: 'idle', measuredLengthIn: null, confidence: 0, flags: [] }));
        return;
      }

      setMeasurement((prev) => ({ ...prev, status: 'running', startedAt: new Date().toISOString() }));
      try {
        const result = await analyzeCatchPhoto({
          photoUri,
          tournamentId: tournament?.id ?? tournamentId,
        });
        if (isMounted) {
          setMeasurement({
            status: result.status ?? 'ok',
            version: result.version ?? 'local-v0',
            measuredLengthIn: result.measuredLengthIn ?? null,
            confidence: Number(result.confidence) || 0,
            flags: Array.isArray(result.flags) ? result.flags : [],
            startedAt: result.startedAt ?? null,
            completedAt: result.completedAt ?? null,
            referenceObject: result.referenceObject ?? null,
          });
        }
      } catch (error) {
        console.error('Local measurement failed', error);
        if (isMounted) {
          setMeasurement((prev) => ({ ...prev, status: 'error', flags: ['MEASUREMENT_ERROR'] }));
        }
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [photoUri, tournament, tournamentId]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (step === STEPS.INSTRUCTIONS) {
      setStep(STEPS.CAPTURE);
      return;
    }

    if (step === STEPS.CAPTURE) {
      setStep(STEPS.CONFIRM);
    }
  };

  const handleCapturePhoto = async () => {
    if (Platform.OS === 'web') {
      setPhotoUri(getMockPhotoUri(tournament?.id ?? tournamentId));
      return;
    }

    if (!cameraPermission?.granted) {
      await requestCameraPermission();
      return;
    }

    if (!cameraRef.current || isCapturing) {
      return;
    }

    setIsCapturing(true);
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (result?.uri) {
        setPhotoUri(result.uri);
      }
    } catch (error) {
      console.error('Camera capture failed', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetakePhoto = () => {
    setPhotoUri(null);
    setStep(STEPS.CAPTURE);
    setCameraKey((prev) => prev + 1);
    setMeasurement({
      status: 'idle',
      version: 'local-v0',
      measuredLengthIn: null,
      confidence: 0,
      flags: [],
      startedAt: null,
      completedAt: null,
    });
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleSubmitCatch = () => {
    const numericLength = Number(lengthInches);

    if (!Number.isFinite(numericLength) || numericLength <= 0) {
      return;
    }

    const capturedAt = new Date().toISOString();

    const submitLocation =
      location && typeof location.lat === 'number' && typeof location.lng === 'number'
        ? {
            lat: location.lat,
            lng: location.lng,
            state: currentState,
            regionName: regionLabel,
          }
        : null;

    const submitLocationStatus = checkLocationAllowedForTournament(tournament, submitLocation);

    if (!submitLocationStatus.allowed) {
      console.warn('Blocked catch submission due to location', submitLocationStatus);
      const message = getLocationBlockMessage(submitLocationStatus);
      if (message) {
        // Keep this lightweight (no new dependencies) and consistent with other screens.
        // eslint-disable-next-line no-alert
        alert(message);
      }
      return;
    }

    // Validate measurement quality for prize-eligible tournaments
    if (photoUri && measurement.status !== 'idle') {
      // Block submission if no reference object detected
      if (measurement.flags?.includes('NO_REFERENCE_FOUND')) {
        Alert.alert(
          'ArUco Marker Required',
          'The ArUco marker was not detected in your photo. Please retake the photo with the marker clearly visible next to the fish.',
          [
            { text: 'Retake Photo', onPress: () => setStep(STEPS.CAPTURE) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Block submission if fish not detected
      if (measurement.flags?.includes('FISH_NOT_DETECTED')) {
        Alert.alert(
          'Fish Not Detected',
          'No fish was detected in your photo. Please retake the photo ensuring the fish is fully visible.',
          [
            { text: 'Retake Photo', onPress: () => setStep(STEPS.CAPTURE) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Build temporary catch data for validation
      const tempCatchData = {
        measurement: measurement.status !== 'idle' ? measurement : null,
      };

      // Check prize eligibility for tournaments with prize pools
      const prizeCheck = canSubmitForPrizes(tempCatchData, tournament);

      if (!prizeCheck.eligible && tournament?.prize_pool > 0) {
        Alert.alert(
          'Measurement Quality',
          `This measurement has ${prizeCheck.reason === 'LOW_CONFIDENCE' ? 'low confidence' : 'quality issues'} and cannot be submitted for prizes.\n\n${prizeCheck.message}\n\nYou can submit for practice or retake the photo.`,
          [
            { text: 'Retake Photo', onPress: () => setStep(STEPS.CAPTURE) },
            {
              text: 'Submit Anyway (No Prize)',
              onPress: () => submitNonPrizeEligible(numericLength, submitLocation, capturedAt),
              style: 'destructive'
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
    }

    // Determine prize eligibility
    const tempCatchData = {
      measurement: measurement.status !== 'idle' ? measurement : null,
    };
    const prizeCheck = canSubmitForPrizes(tempCatchData, tournament);

    const catchRecord = submitCatch(tournament, {
      length: numericLength,
      species: selectedSpecies ?? null,
      photoUri: photoUri ?? getMockPhotoUri(tournament?.id ?? tournamentId),
      measurement:
        measurement?.status && measurement.status !== 'idle'
          ? {
              provider: 'roboflow',
              status: measurement.status,
              version: measurement.version,
              measuredLengthIn: measurement.measuredLengthIn,
              confidence: measurement.confidence,
              flags: measurement.flags,
              startedAt: measurement.startedAt,
              completedAt: measurement.completedAt,
              referenceObject: measurement.referenceObject,
            }
          : null,
      location: {
        lat: submitLocation.lat,
        lng: submitLocation.lng,
        state: submitLocation.state,
        regionName: submitLocation.regionName,
      },
      locationCapturedAt: capturedAt,
      status: 'pending',
      userId: 'me',
      prizeEligible: prizeCheck.eligible,
    });

    if (typeof onCatchSubmitted === 'function') {
      onCatchSubmitted(catchRecord);
    }

    navigation.goBack();
  };

  const submitNonPrizeEligible = (numericLength, submitLocation, capturedAt) => {
    // Submit catch with prizeEligible flag set to false
    const catchRecord = submitCatch(tournament, {
      length: numericLength,
      species: selectedSpecies ?? null,
      photoUri: photoUri ?? getMockPhotoUri(tournament?.id ?? tournamentId),
      measurement:
        measurement?.status && measurement.status !== 'idle'
          ? {
              provider: 'roboflow',
              status: measurement.status,
              version: measurement.version,
              measuredLengthIn: measurement.measuredLengthIn,
              confidence: measurement.confidence,
              flags: measurement.flags,
              startedAt: measurement.startedAt,
              completedAt: measurement.completedAt,
              referenceObject: measurement.referenceObject,
            }
          : null,
      location: {
        lat: submitLocation.lat,
        lng: submitLocation.lng,
        state: submitLocation.state,
        regionName: submitLocation.regionName,
      },
      locationCapturedAt: capturedAt,
      status: 'pending',
      userId: 'me',
      prizeEligible: false, // Mark as not prize-eligible
    });

    if (typeof onCatchSubmitted === 'function') {
      onCatchSubmitted(catchRecord);
    }

    navigation.goBack();
  };

  if (loading || !tournament) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Preparing log flow…</Text>
      </View>
    );
  }

  const { allowed, reason } = locationStatus;
  const canContinue =
    step === STEPS.CAPTURE ? Boolean(photoUri) : true;
  const canSubmit =
    Boolean(photoUri) &&
    Number.isFinite(Number(lengthInches)) &&
    Number(lengthInches) > 0;
  const showLengthError =
    step === STEPS.CONFIRM &&
    Boolean(lengthInches) &&
    (!Number.isFinite(Number(lengthInches)) || Number(lengthInches) <= 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{tournament.name}</Text>
          <Text style={styles.heroSubtitle}>{boundaryDescription}</Text>
          <Text style={styles.heroMeta}>Current location: {locationLabel}</Text>
        </View>

        {!allowed ? (
          <View style={styles.blockedCard}>
            <Icon name="location-off" size={32} color={colors.danger} />
            <Text style={styles.blockedTitle}>Outside allowed area</Text>
            <Text style={styles.blockedMessage}>
              You’re currently outside the allowed area for this tournament.
              {'\n'}
              Only catches inside {tournament.regionName ?? tournament.scopeLevel} count.
            </Text>
            <PrimaryButton
              label="Return"
              icon="arrow-back"
              variant="secondary"
              onPress={handleBack}
            />
            <Text style={styles.debugLabel}>Reason: {reason ?? 'unknown'}</Text>
          </View>
        ) : (
          <View style={styles.instructionsCard}>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>
              {step === STEPS.INSTRUCTIONS
                ? 'Step 1 of 3'
                : step === STEPS.CAPTURE
                ? 'Step 2 of 3'
                : 'Step 3 of 3'}
            </Text>
          </View>

          {step === STEPS.INSTRUCTIONS ? (
            <>
              <SectionHeader
                title="Before you capture"
                subtitle="Make the photo review-proof"
              />
              <Text style={styles.instructionsText}>
                • Place fish on flat surface with ArUco marker next to it{'\n'}
                • Ensure BOTH fish AND marker are fully visible{'\n'}
                • Fish head to left, tail to right, marker parallel{'\n'}
                • Good lighting - no shadows on marker{'\n'}
                • Keep marker flat and level with fish
              </Text>
              <Banner
                variant="info"
                icon="info"
                message="ArUco marker required for accurate measurement. Download and print from tournament resources."
              />
              <View style={styles.actionsRow}>
                <PrimaryButton
                  label="Continue"
                  icon="arrow-forward"
                  onPress={handleContinue}
                />
                <PrimaryButton
                  label="Cancel"
                  icon="close"
                  variant="ghost"
                  onPress={handleBack}
                />
              </View>
            </>
          ) : null}

          {step === STEPS.CAPTURE ? (
            <>
              <SectionHeader
                title="Capture photo"
                subtitle={Platform.OS === 'web' ? 'Web uses a placeholder image for now' : 'Use your camera to capture the fish + ArUco marker'}
              />

              {photoUri ? (
                <View style={styles.photoCard}>
                  <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                </View>
              ) : Platform.OS === 'web' ? (
                <View style={styles.photoPlaceholder}>
                  <Icon name="photo-camera" size={34} color={colors.textMuted} />
                  <Text style={styles.photoPlaceholderText}>Camera capture is mobile-only right now</Text>
                </View>
              ) : !cameraPermission ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={styles.photoPlaceholderText}>Checking camera permission…</Text>
                </View>
              ) : !cameraPermission.granted ? (
                <View style={styles.photoPlaceholder}>
                  <Icon name="lock" size={34} color={colors.textMuted} />
                  <Text style={styles.photoPlaceholderText}>Camera permission required</Text>
                  <Text style={styles.photoPermissionHint}>
                    Tap “Enable Camera” to continue.
                  </Text>
                  <Pressable style={styles.permissionButton} onPress={requestCameraPermission}>
                    <Icon name="photo-camera" size={16} color={colors.background} />
                    <Text style={styles.permissionButtonText}>Enable Camera</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.cameraCard}>
                  <CameraView
                    key={cameraKey}
                    ref={cameraRef}
                    style={styles.camera}
                    facing={cameraFacing}
                    ratio="16:9"
                  />
                  <View style={styles.cameraOverlayTop}>
                    <View style={styles.cameraOverlayChip}>
                      <Icon name="info" size={14} color={colors.textSecondary} />
                      <Text style={styles.cameraOverlayText}>
                        Keep fish + ArUco marker fully in frame
                      </Text>
                    </View>
                    <Pressable style={styles.flipButton} onPress={handleFlipCamera}>
                      <Icon name="flip-camera-android" size={18} color={colors.textPrimary} />
                    </Pressable>
                  </View>
                  <View style={styles.cameraOverlayBottom}>
                    <Pressable
                      style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                      onPress={handleCapturePhoto}
                      disabled={isCapturing}
                    >
                      <View style={styles.captureButtonInner} />
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={styles.actionsRow}>
                <PrimaryButton
                  label={photoUri ? 'Retake' : Platform.OS === 'web' ? 'Use Placeholder Photo' : 'Capture Photo'}
                  icon={photoUri ? 'refresh' : 'camera-alt'}
                  variant="secondary"
                  onPress={photoUri ? handleRetakePhoto : handleCapturePhoto}
                  disabled={Platform.OS !== 'web' && !photoUri && Boolean(cameraPermission) && !cameraPermission.granted}
                />
                <PrimaryButton
                  label="Use Photo"
                  icon="check-circle"
                  onPress={handleContinue}
                  disabled={!canContinue}
                />
                <PrimaryButton
                  label="Cancel"
                  icon="close"
                  variant="ghost"
                  onPress={handleBack}
                />
              </View>
            </>
          ) : null}

          {step === STEPS.CONFIRM ? (
            <>
              <SectionHeader
                title="Confirm & submit"
                subtitle="Enter length (v1 is manual)"
              />

              {photoUri ? (
                <View style={styles.photoCard}>
                  <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
                </View>
              ) : null}

              {photoUri ? (
                <View style={styles.measurementBlock}>
                  {measurement.status === 'running' ? (
                    <Banner variant="info" icon="radar" message="AI measurement running…" />
                  ) : measurement.flags?.includes('NO_REFERENCE_FOUND') ? (
                    <Banner
                      variant="danger"
                      icon="error"
                      message="ArUco marker not detected - retake photo with marker visible"
                    />
                  ) : measurement.flags?.includes('FISH_NOT_DETECTED') ? (
                    <Banner
                      variant="danger"
                      icon="error"
                      message="Fish not detected - ensure fish is fully visible in photo"
                    />
                  ) : measurement.flags?.includes('MULTIPLE_FISH') ? (
                    <Banner
                      variant="warning"
                      icon="info"
                      message="Multiple fish detected - measurement may be inaccurate"
                    />
                  ) : measurement.flags?.includes('OFFLINE') ? (
                    <Banner
                      variant="warning"
                      icon="cloud-off"
                      message="Offline - measurement will be processed when connected"
                    />
                  ) : measurement.status === 'ok' ? (
                    <>
                      <Banner
                        variant="success"
                        icon="check-circle"
                        message={`AI measured: ${
                          measurement.measuredLengthIn ? `${measurement.measuredLengthIn}"` : '—'
                        } (${(measurement.confidence * 100).toFixed(0)}% confident)`}
                      />
                      {measurement.referenceObject?.detected && (
                        <Text style={styles.measurementNote}>
                          Reference marker detected with {(measurement.referenceObject.confidence * 100).toFixed(0)}% confidence
                        </Text>
                      )}
                    </>
                  ) : measurement.status === 'low_confidence' ? (
                    <Banner
                      variant="warning"
                      icon="warning"
                      message={`Measurement uncertain (${(measurement.confidence * 100).toFixed(0)}%) - please verify manually or retake`}
                    />
                  ) : measurement.status === 'error' ? (
                    <Banner variant="danger" icon="error-outline" message="Measurement failed - using manual length" />
                  ) : null}

                  {measurement.measuredLengthIn ? (
                    <View style={styles.measurementActions}>
                      <PrimaryButton
                        label={`Use ${measurement.measuredLengthIn}"`}
                        icon="auto-fix-high"
                        variant="secondary"
                        onPress={() => setLengthInches(String(measurement.measuredLengthIn))}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>Length (inches)</Text>
                <TextInput
                  value={lengthInches}
                  onChangeText={setLengthInches}
                  placeholder="e.g. 32.5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
                {showLengthError ? (
                  <Text style={styles.inputError}>
                    Enter a valid length (example: 32.5)
                  </Text>
                ) : null}
                <Text style={styles.inputHint}>
                  We’ll store GPS + timestamp with your submission for verification later.
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <PrimaryButton
                  label="Submit"
                  icon="send"
                  onPress={handleSubmitCatch}
                  disabled={!canSubmit}
                />
                <PrimaryButton
                  label="Retake Photo"
                  icon="refresh"
                  variant="secondary"
                  onPress={handleRetakePhoto}
                />
                <PrimaryButton
                  label="Cancel"
                  icon="close"
                  variant="ghost"
                  onPress={handleBack}
                />
              </View>
            </>
          ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textMuted,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroTitle: {
    ...typography.title,
    color: colors.textHighlight,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  heroMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  instructionsCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  stepPillText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  instructionsText: {
    ...typography.body,
    lineHeight: 22,
    color: colors.textHighlight,
  },
  photoCard: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    height: 240,
  },
  photoPlaceholder: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  photoPlaceholderText: {
    ...typography.body,
    color: colors.textMuted,
  },
  photoPermissionHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs / 2,
  },
  permissionButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  permissionButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cameraCard: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    height: 280,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlayTop: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraOverlayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 17, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    flex: 1,
    marginRight: spacing.sm,
  },
  cameraOverlayText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  flipButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(11, 17, 32, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.md,
    alignItems: 'center',
  },
  captureButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.55,
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ffffff',
  },
  actionsRow: {
    gap: spacing.sm,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.subtitle,
    color: colors.textHighlight,
  },
  inputHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  inputError: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs / 2,
    fontWeight: '700',
  },
  measurementBlock: {
    gap: spacing.sm,
  },
  measurementActions: {
    alignSelf: 'flex-start',
  },
  measurementNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  blockedCard: {
    backgroundColor: '#7f1d1d33',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  blockedTitle: {
    ...typography.subtitle,
    color: colors.danger,
  },
  blockedMessage: {
    ...typography.body,
    color: colors.textHighlight,
    textAlign: 'center',
  },
  debugLabel: {
    ...typography.caption,
    color: colors.danger,
  },
});

