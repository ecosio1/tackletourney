import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import useUserLocation from '../../hooks/useUserLocation';
import {
  checkLocationAllowedForTournament,
  describeBoundary,
} from '../../utils/location-boundary';
import { tournamentAPI } from '../../services/api';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SectionHeader from '../../components/ui/SectionHeader';
import { colors, radius, spacing, typography } from '../../styles/tokens';

export default function LogFishScreen({ route, navigation }) {
  const { tournamentId, tournament: initialTournament } = route.params ?? {};

  const { location, locationLabel } = useUserLocation();
  const [tournament, setTournament] = useState(initialTournament ?? null);
  const [loading, setLoading] = useState(!initialTournament);
  const [locationStatus, setLocationStatus] = useState({
    allowed: false,
    reason: 'LOADING',
  });

  const boundaryDescription = useMemo(
    () => describeBoundary(tournament),
    [tournament]
  );

  useEffect(() => {
    if (initialTournament) {
      setLoading(false);
      return;
    }

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
  }, [initialTournament, tournamentId]);

  useEffect(() => {
    if (!tournament || !location) {
      return;
    }

    const status = checkLocationAllowedForTournament(tournament, location);
    setLocationStatus(status);
  }, [tournament, location]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleOpenCamera = () => {
    navigation.navigate('CatchCamera', {
      tournament_id: tournament?.id ?? tournamentId,
    });
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

  return (
    <View style={styles.container}>
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
            Move inside the tournament boundary to log a fish.
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
          <SectionHeader
            title="Before you capture"
            subtitle="Follow on-screen prompts for the perfect submission"
          />
          <Text style={styles.instructionsText}>
            • Place fish on an approved measuring surface{'\n'}
            • Keep the entire fish visible in frame{'\n'}
            • Show today’s verification code clearly{'\n'}
            • Take photo within the allowed boundary
          </Text>

          <View style={styles.actionsRow}>
            <PrimaryButton
              label="Open Camera"
              icon="camera-alt"
              onPress={handleOpenCamera}
            />
            <PrimaryButton
              label="Cancel"
              icon="close"
              variant="ghost"
              onPress={handleBack}
            />
          </View>
        </View>
      )}
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
  instructionsText: {
    ...typography.body,
    lineHeight: 22,
    color: colors.textHighlight,
  },
  actionsRow: {
    gap: spacing.sm,
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

