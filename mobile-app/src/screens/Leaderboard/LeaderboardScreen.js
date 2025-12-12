import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { tournamentAPI } from '../../services/api';
import { useCatches } from '../../state/catches-context';
import { getTournamentLeaderboard } from '../../utils/leaderboard';
import { getTournamentLifecycle, TOURNAMENT_LIFECYCLE } from '../../utils/tournament-lifecycle';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import LeaderboardRow from '../../components/ui/LeaderboardRow';

export default function LeaderboardScreen({ route }) {
  const tournamentId = route?.params?.tournamentId ?? route?.params?.tournament_id ?? null;
  const { catches } = useCatches();
  const [tournament, setTournament] = useState(null);
  const [mockLeaderboard, setMockLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!tournamentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [tournamentData, leaderboardData] = await Promise.all([
          tournamentAPI.getTournamentById(tournamentId),
          tournamentAPI.getLeaderboard(tournamentId),
        ]);

        if (isMounted) {
          setTournament(tournamentData);
          setMockLeaderboard(leaderboardData?.leaderboard ?? []);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [tournamentId]);

  const leaderboard = useMemo(() => {
    if (!tournamentId) {
      return { entries: [], currentUserRank: null };
    }

    return getTournamentLeaderboard({
      tournamentId,
      mockLeaderboard,
      catches,
    });
  }, [tournamentId, mockLeaderboard, catches]);

  const lifecycle = useMemo(() => getTournamentLifecycle(tournament), [tournament]);
  const isFinal =
    lifecycle === TOURNAMENT_LIFECYCLE.ENDED || lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED;

  if (!tournamentId) {
    return (
      <View style={styles.center}>
        <Icon name="leaderboard" size={44} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Select a tournament</Text>
        <Text style={styles.emptyText}>
          Open a tournament and tap “View Leaderboard”.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{tournament?.name ?? 'Leaderboard'}</Text>
        {isFinal ? (
          <View style={styles.finalBanner}>
            <Icon name="emoji-events" size={16} color={colors.warning} />
            <Text style={styles.finalBannerText}>
              Final placements • Submissions locked
            </Text>
          </View>
        ) : null}
        {leaderboard.currentUserRank ? (
          <View style={styles.youPill}>
            <Icon name="person" size={16} color={colors.background} />
            <Text style={styles.youPillText}>You’re #{leaderboard.currentUserRank}</Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>
            {isFinal ? 'Final results posted.' : 'Log a fish to appear on the leaderboard.'}
          </Text>
        )}
      </View>

      {leaderboard.entries.length ? (
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {leaderboard.entries.length} {leaderboard.entries.length === 1 ? 'Angler' : 'Anglers'} • Sorted by length
            </Text>
          </View>
          {leaderboard.entries.map((entry) => (
            <LeaderboardRow
              key={`${entry.source}_${entry.rank}_${entry.angler}`}
              entry={entry}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Icon name="emoji-events" size={34} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No catches yet</Text>
          <Text style={styles.emptyText}>
            Be the first angler to log a catch and claim the top spot!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textHighlight,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  finalBanner: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  finalBannerText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  youPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  youPillText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listHeaderText: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.textHighlight,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
