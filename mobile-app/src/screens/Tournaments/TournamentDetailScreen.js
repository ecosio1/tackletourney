import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { tournamentAPI } from '../../services/api';
import { useJoinedTournaments } from '../../state/joined-tournaments-context';
import { useCatches } from '../../state/catches-context';
import SectionHeader from '../../components/ui/SectionHeader';
import StatPill from '../../components/ui/StatPill';
import PrimaryButton from '../../components/ui/PrimaryButton';
import Card from '../../components/ui/Card';
import Banner from '../../components/ui/Banner';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import { isTournamentActive } from '../../utils/location-boundary';
import {
  canJoinTournament,
  canSubmitCatch,
  getTournamentLifecycle,
  TOURNAMENT_LIFECYCLE,
} from '../../utils/tournament-lifecycle';

const STATE_NAMES = {
  FL: 'Florida',
};

function getStateLabel(stateCode) {
  return STATE_NAMES[stateCode] ?? stateCode ?? '';
}

function formatDateTimeRange(start, end) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (!startDate || !endDate || Number.isNaN(startDate) || Number.isNaN(endDate)) {
    return 'Schedule to be announced';
  }

  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const today = new Date();
  const isToday =
    startDate.getFullYear() === today.getFullYear() &&
    startDate.getMonth() === today.getMonth() &&
    startDate.getDate() === today.getDate();

  const dayLabel = isToday
    ? 'Today'
    : startDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  const timeOptions = { hour: 'numeric', minute: 'numeric' };
  const startTime = startDate.toLocaleTimeString(undefined, timeOptions);
  const endTime = endDate.toLocaleTimeString(undefined, timeOptions);

  if (sameDay) {
    return `${dayLabel} · ${startTime} – ${endTime}`;
  }

  const endLabel = endDate.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  return `${dayLabel} ${startTime} → ${endLabel}`;
}

function getScopeDetails(tournament) {
  if (!tournament) {
    return { title: '', coverage: '' };
  }

  const stateLabel = getStateLabel(tournament.state);
  const { scopeLevel, regionName, geoBoundary } = tournament;
  const radiusKm = geoBoundary?.radiusKm;
  const centerLabel =
    regionName || geoBoundary?.name || geoBoundary?.label || 'selected area';

  if (scopeLevel === 'STATE') {
    return {
      title: `${stateLabel} • Statewide`,
      coverage: `Fish anywhere in ${stateLabel}.`,
    };
  }

  if (scopeLevel === 'REGION') {
    return {
      title: `${stateLabel}${regionName ? ` • ${regionName}` : ''}`,
      coverage: regionName
        ? `Fish within the ${regionName} region of ${stateLabel}.`
        : `Regional boundary inside ${stateLabel}.`,
    };
  }

  if (scopeLevel === 'LOCAL') {
    return {
      title: `${stateLabel}${regionName ? ` • ${regionName}` : ''}`,
      coverage: regionName
        ? `Local-only tournament in ${regionName}, ${stateLabel}.`
        : `Local-only tournament inside ${stateLabel}.`,
    };
  }

  if (scopeLevel === 'RADIUS') {
    const miles =
      typeof radiusKm === 'number'
        ? Math.round(radiusKm * 0.621371)
        : undefined;

    return {
      title: `${stateLabel}${regionName ? ` • ${regionName}` : ''}`,
      coverage:
        typeof miles === 'number'
          ? `Within ${miles} miles of ${centerLabel}.`
          : `Radius-based boundary near ${centerLabel}.`,
    };
  }

  return {
    title: `${stateLabel}`,
    coverage: 'Boundary defined for this tournament.',
  };
}

function formatCurrency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Free';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export default function TournamentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const { isTournamentJoined, joinTournament, isJoining } =
    useJoinedTournaments();
  const { getCatchesForTournament } = useCatches();
  const joined = isTournamentJoined(id);
  const joining = isJoining(id);
  const [catchToast, setCatchToast] = useState(null);

  useEffect(() => {
    loadTournamentDetails();
  }, [id]);

  useEffect(() => {
    if (!joined) {
      setJoinSuccess(false);
    }
  }, [joined]);

  const catchesForTournament = useMemo(
    () => getCatchesForTournament(id),
    [getCatchesForTournament, id]
  );

  const handleCatchSubmitted = useCallback((catchRecord) => {
    setCatchToast(`Catch submitted (${catchRecord.length}" ${catchRecord.species ?? ''})`);
    setTimeout(() => setCatchToast(null), 3500);
  }, []);

  const scopeDetails = useMemo(() => getScopeDetails(tournament), [tournament]);
  const scheduleLabel = useMemo(
    () => formatDateTimeRange(tournament?.start_time, tournament?.end_time),
    [tournament?.start_time, tournament?.end_time]
  );

  const loadTournamentDetails = async () => {
    try {
      const data = await tournamentAPI.getTournamentById(id);
      setTournament(data);
    } catch (requestError) {
      console.error('Error loading tournament:', requestError);
      Alert.alert('Error', 'Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = useCallback(async () => {
    setError(null);
    setJoinSuccess(false);
    try {
      await joinTournament(id);
      setJoinSuccess(true);
    } catch (requestError) {
      const message =
        requestError?.response?.data?.error ??
        requestError?.message ??
        'Failed to join tournament.';
      setError(message);
    }
  }, [id, joinTournament]);

  const handleLogCatch = () => {
    navigation.navigate('LogFish', {
      tournamentId: id,
      onCatchSubmitted: handleCatchSubmitted,
    });
  };

  const handleViewLeaderboard = () => {
    navigation.navigate('Leaderboard', { tournamentId: id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingText}>Tournament not found.</Text>
      </View>
    );
  }

  const prizePool = parseFloat(tournament.prize_pool || 0);
  const now = new Date();
  const startDate = tournament.start_time ? new Date(tournament.start_time) : null;
  const endDate = tournament.end_time ? new Date(tournament.end_time) : null;
  const hasValidWindow =
    startDate &&
    endDate &&
    !Number.isNaN(startDate) &&
    !Number.isNaN(endDate);
  const isEnded = Boolean(hasValidWindow && now > endDate);
  const isActiveNow = Boolean(hasValidWindow && isTournamentActive(tournament, now));
  const lifecycle = getTournamentLifecycle(tournament, now);
  const isUpcoming = lifecycle === TOURNAMENT_LIFECYCLE.UPCOMING;
  const isEndingSoon = lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON;
  const isArchived = lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED;
  const joinable = canJoinTournament(tournament, now);
  const canLogCatch = canSubmitCatch(tournament, now);

  const startTimeLabel = startDate
    ? startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null;

  const joinedBannerMessage = isArchived
    ? 'Tournament archived. Final placements are available.'
    : isEnded
    ? 'Tournament ended. Final placements are available.'
    : isEndingSoon
    ? 'Ending soon. Submit your last catches before time runs out.'
    : isActiveNow
    ? 'You’re in! Stay within the boundary to log fish.'
    : startTimeLabel
    ? `You’re in! Logging unlocks at ${startTimeLabel}.`
    : 'You’re in! Logging unlocks when the event is active.';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.heroCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusLabel}>
                {(lifecycle === TOURNAMENT_LIFECYCLE.LIVE
                  ? 'LIVE'
                  : lifecycle === TOURNAMENT_LIFECYCLE.ENDED
                  ? 'ENDED'
                  : lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED
                  ? 'ARCHIVED'
                  : lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON
                  ? 'ENDING SOON'
                  : 'UPCOMING')}
              </Text>
            </View>
            {joined ? (
              <View style={styles.joinedPill}>
                <Icon name='check-circle' size={16} color={colors.background} />
                <Text style={styles.joinedPillText}>You’re joined</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.heroTitle}>{tournament.name}</Text>
          {scopeDetails.title ? (
            <Text style={styles.scopeTitle}>{scopeDetails.title}</Text>
          ) : null}
          {scopeDetails.coverage ? (
            <Text style={styles.scopeCoverage}>{scopeDetails.coverage}</Text>
          ) : null}

          <View style={styles.heroStats}>
            <StatPill
              icon='attach-money'
              label='Prize Pool'
              value={prizePool > 0 ? formatCurrency(prizePool) : 'Free'}
              emphasis='accent'
            />
            <StatPill
              icon='sell'
              label='Entry Fee'
              value={formatCurrency(tournament.entry_fee)}
            />
            <StatPill
              icon='groups'
              label='Anglers'
              value={tournament.participant_count ?? 0}
            />
            <StatPill
              icon='emoji-events'
              label='My Catches'
              value={catchesForTournament.length}
            />
          </View>
        </Card>

        <Card variant="muted" style={styles.sectionCard}>
          <SectionHeader title='Tournament Info' subtitle={scheduleLabel} />
          <View style={styles.infoRow}>
            <Icon name='pets' size={20} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Target Species: {tournament.species.join(', ')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name='place' size={20} color={colors.textMuted} />
            <Text style={styles.infoText}>{scopeDetails.coverage}</Text>
          </View>
        </Card>

        <Card variant="muted" style={styles.sectionCard}>
          <SectionHeader
            title='Rules Overview'
            subtitle='Full rules available from the host'
          />
          <Text style={styles.rulesText}>
            • Fish must match approved species{'\n'}
            • Capture within the active event window{'\n'}
            • Use an approved measuring surface{'\n'}
            • Photos must be taken through the app{'\n'}
            • Verification code must be visible{'\n'}
            • GPS location will be verified for each catch
          </Text>
        </Card>

        {error && (
          <Banner variant="danger" message={error} />
        )}

        {joinSuccess && (
          <Banner
            variant="success"
            icon="celebration"
            message="You joined this tournament. Get ready for the first cast!"
          />
        )}

        {catchToast && (
          <Banner variant="success" icon="check-circle" message={catchToast} />
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!joined ? (
          <PrimaryButton
            label={
              !joinable
                ? 'Tournament Ended'
                : joining
                ? 'Joining…'
                : 'Join Tournament'
            }
            icon='how-to-reg'
            onPress={handleJoinTournament}
            disabled={joining || !joinable}
          />
        ) : (
          <>
            <View style={styles.joinedBanner}>
              <Icon name='check-circle' size={20} color={colors.accent} />
              <Text style={styles.joinedBannerText}>{joinedBannerMessage}</Text>
            </View>
            {isEnded || isArchived ? (
              <PrimaryButton
                label={isArchived ? 'Archived · View Final Placements' : 'Tournament Ended · View Final Placements'}
                icon='leaderboard'
                onPress={handleViewLeaderboard}
              />
            ) : (
              <>
                <PrimaryButton
                  label={
                    canLogCatch
                      ? isEndingSoon
                        ? 'Log Fish (Ending soon)'
                        : 'Log Fish'
                      : isUpcoming && startTimeLabel
                      ? `Starts at ${startTimeLabel}`
                      : 'Log Fish (locked)'
                  }
                  icon={canLogCatch ? 'camera-alt' : 'schedule'}
                  onPress={handleLogCatch}
                  disabled={!canLogCatch}
                />
                <View style={styles.secondaryButtonWrapper}>
                  <PrimaryButton
                    label={isActiveNow ? 'View Leaderboard' : 'View Leaderboard'}
                    icon='leaderboard'
                    variant='secondary'
                    onPress={handleViewLeaderboard}
                  />
                </View>
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  missingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  missingText: {
    ...typography.subtitle,
    color: colors.textMuted,
  },
  heroCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    backgroundColor: colors.accentDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs / 2,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.background,
    letterSpacing: 1,
    fontWeight: '700',
  },
  joinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  joinedPillText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
  },
  heroTitle: {
    ...typography.heading,
    color: colors.textHighlight,
    marginTop: spacing.sm,
  },
  scopeTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  scopeCoverage: {
    ...typography.body,
    color: colors.textMuted,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textHighlight,
    flex: 1,
  },
  rulesText: {
    ...typography.body,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  joinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  joinedBannerText: {
    ...typography.body,
    color: colors.textHighlight,
    flex: 1,
  },
  secondaryButtonWrapper: {
    marginTop: spacing.sm / 2,
  },
});
