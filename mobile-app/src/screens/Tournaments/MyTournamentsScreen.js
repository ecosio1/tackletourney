import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useJoinedTournaments } from '../../state/joined-tournaments-context';
import { tournamentAPI } from '../../services/api';
import TournamentCard from '../../components/ui/TournamentCard';
import SectionHeader from '../../components/ui/SectionHeader';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import { getTournamentLifecycle, TOURNAMENT_LIFECYCLE } from '../../utils/tournament-lifecycle';

export default function MyTournamentsScreen({ navigation }) {
  const { joinedTournaments, isHydrated } = useJoinedTournaments();
  const [tournamentById, setTournamentById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isHydrated) {
        return;
      }

      const ids = joinedTournaments.map((entry) => entry.id).filter(Boolean);
      if (!ids.length) {
        if (isMounted) {
          setTournamentById({});
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const tournament = await tournamentAPI.getTournamentById(id);
            return { id, tournament };
          })
        );

        if (isMounted) {
          setTournamentById(
            results.reduce((acc, item) => {
              if (item.tournament) {
                acc[item.id] = item.tournament;
              }
              return acc;
            }, {})
          );
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
  }, [isHydrated, joinedTournaments]);

  const now = useMemo(() => new Date(), []);

  const joinedList = useMemo(() => {
    return joinedTournaments
      .map((entry) => ({
        ...entry,
        tournament: tournamentById[entry.id] ?? null,
      }))
      .filter((entry) => entry.tournament);
  }, [joinedTournaments, tournamentById]);

  const active = useMemo(
    () =>
      joinedList.filter((entry) => {
        const lifecycle = getTournamentLifecycle(entry.tournament, now);
        return lifecycle === TOURNAMENT_LIFECYCLE.LIVE || lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON;
      }),
    [joinedList, now]
  );
  const past = useMemo(
    () =>
      joinedList.filter((entry) => getTournamentLifecycle(entry.tournament, now) === TOURNAMENT_LIFECYCLE.ENDED),
    [joinedList, now]
  );
  const archived = useMemo(
    () =>
      joinedList.filter((entry) => getTournamentLifecycle(entry.tournament, now) === TOURNAMENT_LIFECYCLE.ARCHIVED),
    [joinedList, now]
  );

  if (!isHydrated || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading tournaments…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <SectionHeader title="My Tournaments" subtitle="Events you've joined" />

      {!joinedList.length ? (
        <View style={styles.emptyCard}>
          <Icon name="event-busy" size={34} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No tournaments joined yet</Text>
          <Text style={styles.emptyText}>Head to Home and join an event to get started.</Text>
        </View>
      ) : (
        <>
          {active.length ? (
            <>
              <SectionHeader title="Active" subtitle="Ready to log catches" />
              {active.map((entry) => (
                <TournamentCard
                  key={entry.id}
                  tournament={entry.tournament}
                  joined
                  scopeLabel={entry.tournament.regionName ?? entry.tournament.scopeLevel}
                  onPress={() => navigation.navigate('TournamentDetail', { id: entry.id })}
                />
              ))}
            </>
          ) : null}

          {past.length ? (
            <>
              <SectionHeader title="Past" subtitle="Completed tournaments" />
              {past.map((entry) => (
                <TournamentCard
                  key={entry.id}
                  tournament={entry.tournament}
                  joined
                  showJoinBadge={false}
                  scopeLabel={entry.tournament.regionName ?? entry.tournament.scopeLevel}
                  onPress={() => navigation.navigate('TournamentDetail', { id: entry.id })}
                />
              ))}
            </>
          ) : null}

          {archived.length ? (
            <>
              <SectionHeader title="Archived" subtitle="Finalized events" />
              {archived.map((entry) => (
                <TournamentCard
                  key={entry.id}
                  tournament={entry.tournament}
                  joined
                  showJoinBadge={false}
                  scopeLabel={entry.tournament.regionName ?? entry.tournament.scopeLevel}
                  onPress={() => navigation.navigate('TournamentDetail', { id: entry.id })}
                />
              ))}
            </>
          ) : null}
        </>
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
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.lg,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textMuted,
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
