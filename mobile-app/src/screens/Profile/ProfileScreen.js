import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useJoinedTournaments } from '../../state/joined-tournaments-context';
import { useCatches } from '../../state/catches-context';
import { tournamentAPI } from '../../services/api';
import TournamentCard from '../../components/ui/TournamentCard';
import SectionHeader from '../../components/ui/SectionHeader';
import StatPill from '../../components/ui/StatPill';
import CatchCard from '../../components/ui/CatchCard';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import { isTournamentActive } from '../../utils/location-boundary';

function isTournamentEnded(tournament, now) {
  if (!tournament?.end_time) {
    return false;
  }

  const end = new Date(tournament.end_time);
  if (Number.isNaN(end)) {
    return false;
  }

  return now > end;
}

function hashToPositiveInt(value) {
  const str = String(value ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function formatPlacement(place) {
  const n = Number(place);
  if (!Number.isFinite(n) || n <= 0) {
    return '--';
  }

  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${n}th`;
  }

  const last = n % 10;
  if (last === 1) {
    return `${n}st`;
  }
  if (last === 2) {
    return `${n}nd`;
  }
  if (last === 3) {
    return `${n}rd`;
  }
  return `${n}th`;
}

function getMockTournamentResult(tournamentId) {
  const seed = hashToPositiveInt(tournamentId);
  const placement = (seed % 8) + 1;
  const prizeByPlacement = new Map([
    [1, 250],
    [2, 125],
    [3, 75],
  ]);

  const basePrize = prizeByPlacement.get(placement) ?? 0;
  const bonus = placement <= 3 ? (seed % 25) : 0;
  const prize = basePrize + bonus;

  return {
    placement,
    prize,
    points: 1000 + (seed % 450),
  };
}

function PastResultRow({ title, subtitle, placement, prize, onPress }) {
  const isWin = placement === 1;
  const badgeBg = isWin ? 'rgba(251, 191, 36, 0.18)' : colors.surfaceHighlight;
  const badgeBorder = isWin ? '#fbbf24' : colors.border;
  const badgeText = isWin ? '#fbbf24' : colors.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.resultRow}
    >
      <View style={styles.resultLeft}>
        <View style={[styles.resultBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
          <Icon
            name={isWin ? 'emoji-events' : 'military-tech'}
            size={16}
            color={badgeText}
          />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.resultRight}>
        <Text style={styles.resultPlacement}>{formatPlacement(placement)}</Text>
        <Text style={styles.resultPrize}>{prize > 0 ? `+$${prize}` : '—'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { joinedTournaments, isHydrated: joinedHydrated } = useJoinedTournaments();
  const { catches, isHydrated: catchesHydrated } = useCatches();
  const [tournamentById, setTournamentById] = useState({});
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [devTapCount, setDevTapCount] = useState(0);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!devTapCount) {
      return;
    }

    const timeout = setTimeout(() => setDevTapCount(0), 1200);
    return () => clearTimeout(timeout);
  }, [devTapCount]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!joinedHydrated) {
        return;
      }

      const ids = joinedTournaments.map((entry) => entry.id).filter(Boolean);
      if (!ids.length) {
        if (isMounted) {
          setTournamentById({});
          setLoadingTournaments(false);
        }
        return;
      }

      setLoadingTournaments(true);
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
          setLoadingTournaments(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [joinedHydrated, joinedTournaments]);

  const now = useMemo(() => new Date(), []);

  const joinedTournamentList = useMemo(() => {
    return joinedTournaments
      .map((entry) => ({
        ...entry,
        tournament: tournamentById[entry.id] ?? null,
      }))
      .filter((entry) => entry.tournament);
  }, [joinedTournaments, tournamentById]);

  const activeJoined = useMemo(() => {
    return joinedTournamentList
      .filter((entry) => isTournamentActive(entry.tournament, now))
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  }, [joinedTournamentList, now]);

  const pastJoined = useMemo(() => {
    return joinedTournamentList
      .filter((entry) => isTournamentEnded(entry.tournament, now))
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  }, [joinedTournamentList, now]);

  const myCatches = useMemo(() => {
    return catches
      .filter((entry) => entry.userId === 'me')
      .map((entry) => ({
        ...entry,
        tournamentName: tournamentById[entry.tournamentId]?.name ?? entry.tournamentId,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [catches, tournamentById]);

  const tournamentCatchCounts = useMemo(() => {
    return myCatches.reduce((acc, entry) => {
      const key = entry.tournamentId ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [myCatches]);

  const personalBests = useMemo(() => {
    const bestBySpecies = {};
    myCatches.forEach((entry) => {
      const species = entry.species ?? 'Unknown';
      const length = Number(entry.length) || 0;

      if (!bestBySpecies[species] || length > bestBySpecies[species].length) {
        bestBySpecies[species] = {
          species,
          length,
          tournamentName: entry.tournamentName,
          createdAt: entry.createdAt,
        };
      }
    });

    return Object.values(bestBySpecies).sort((a, b) => b.length - a.length);
  }, [myCatches]);

  const recentCatches = useMemo(() => myCatches.slice(0, 3), [myCatches]);

  const biggestSnook = useMemo(() => {
    const snookCatches = myCatches.filter((entry) =>
      String(entry.species ?? '').toLowerCase().includes('snook')
    );

    if (!snookCatches.length) {
      return null;
    }

    return snookCatches.reduce((best, entry) => {
      const length = Number(entry.length) || 0;
      if (!best || length > best.length) {
        return { length, tournamentName: entry.tournamentName };
      }
      return best;
    }, null);
  }, [myCatches]);

  const pastResults = useMemo(() => {
    return pastJoined.map((entry) => {
      const result = getMockTournamentResult(entry.id);
      const count = tournamentCatchCounts[entry.id] ?? 0;
      return {
        id: entry.id,
        tournament: entry.tournament,
        placement: result.placement,
        prize: result.prize,
        points: result.points,
        catchesSubmitted: count,
      };
    });
  }, [pastJoined, tournamentCatchCounts]);

  const stats = useMemo(() => {
    const totalLength = myCatches.reduce((sum, entry) => sum + (Number(entry.length) || 0), 0);
    const biggestCatch = myCatches.length ? Math.max(...myCatches.map((e) => Number(e.length) || 0)) : 0;
    const speciesCount = new Set(myCatches.map((e) => e.species).filter(Boolean)).size;
    const wins = pastResults.filter((entry) => entry.placement === 1).length;
    const topThree = pastResults.filter((entry) => entry.placement <= 3).length;
    const bestFinish = pastResults.length ? Math.min(...pastResults.map((e) => e.placement)) : null;
    const totalPrize = pastResults.reduce((sum, entry) => sum + (Number(entry.prize) || 0), 0);

    return {
      totalCatches: myCatches.length,
      biggestCatch,
      totalLength: totalLength.toFixed(1),
      avgLength: myCatches.length ? (totalLength / myCatches.length).toFixed(1) : 0,
      speciesCount,
      tournamentsWon: wins,
      podiumFinishes: topThree,
      bestFinish,
      totalPrize,
    };
  }, [myCatches, pastResults]);

  const isLoading = !joinedHydrated || !catchesHydrated || loadingTournaments;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (isDevUnlocked) {
                  return;
                }
                setDevTapCount((prev) => {
                  const next = prev + 1;
                  if (next >= 7) {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsDevUnlocked(true);
                    return 0;
                  }
                  return next;
                });
              }}
            >
              <Text style={styles.headerLabel}>
                Angler Profile{isDevUnlocked ? ' • Dev' : ''}
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>You</Text>
            <Text style={styles.headerSubtitle}>Local mode • Mock account</Text>
          </View>
          <View style={styles.avatar}>
            <Icon name="person" size={26} color={colors.background} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatPill icon="event" label="Joined" value={joinedTournaments.length} />
          <StatPill icon="emoji-events" label="Catches" value={myCatches.length} emphasis="accent" />
          <StatPill icon="schedule" label="Active" value={activeJoined.length} />
        </View>

        <SegmentedTabs
          value={activeTab}
          onChange={(next) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveTab(next);
          }}
          items={[
            { value: 'overview', label: 'Profile', icon: 'insights' },
            { value: 'catches', label: 'My Catches', icon: 'phishing' },
          ]}
        />
      </Card>

      {isDevUnlocked ? (
        <Card variant="muted" style={styles.devCard}>
          <View style={styles.devRow}>
            <View style={styles.devLeft}>
              <Icon name="build" size={18} color={colors.neonBlue} />
              <View style={styles.devTextBlock}>
                <Text style={styles.devTitle}>Dev Tools</Text>
                <Text style={styles.devSubtitle}>Reset local data and switch location presets</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('DevTools')}
              activeOpacity={0.85}
              style={styles.devButton}
            >
              <Text style={styles.devButtonText}>Open</Text>
              <Icon name="chevron-right" size={18} color={colors.background} />
            </TouchableOpacity>
          </View>
        </Card>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Quick Stats"
          subtitle="Progress that keeps you coming back"
        />
        <View style={styles.pillGrid}>
          <StatPill
            icon="emoji-events"
            label="Total wins"
            value={stats.tournamentsWon}
            emphasis={stats.tournamentsWon > 0 ? 'accent' : 'default'}
          />
          <StatPill
            icon="military-tech"
            label="Top 3 finishes"
            value={stats.podiumFinishes}
          />
          <StatPill
            icon="payments"
            label="Earnings"
            value={stats.totalPrize > 0 ? `$${stats.totalPrize}` : '$0'}
          />
          <StatPill
            icon="straighten"
            label="Biggest snook"
            value={biggestSnook ? `${biggestSnook.length.toFixed(1)}"` : '—'}
            emphasis={biggestSnook ? 'accent' : 'default'}
          />
        </View>
      </View>

      {activeTab === 'overview' ? (
        <>
          <View style={styles.section}>
            <SectionHeader title="Past Results" subtitle="Your finishes (mocked for now)" />
            {!pastResults.length ? (
              <EmptyState
                icon="emoji-events"
                title="No results yet"
                message="Finish a tournament and this becomes your trophy shelf."
              />
            ) : (
              <View style={styles.resultsCard}>
                {pastResults.map((entry, idx) => (
                  <View
                    key={entry.id}
                    style={[
                      idx !== pastResults.length - 1 && styles.resultsRowDivider,
                    ]}
                  >
                    <PastResultRow
                      title={entry.tournament?.name ?? entry.id}
                      subtitle={`${entry.catchesSubmitted} ${entry.catchesSubmitted === 1 ? 'catch' : 'catches'} • ${entry.points} pts`}
                      placement={entry.placement}
                      prize={entry.prize}
                      onPress={() => navigation.navigate('TournamentDetail', { id: entry.id })}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <SectionHeader
                title="Catches Submitted"
                subtitle="Your recent logs across tournaments"
              />
              <TouchableOpacity
                onPress={() => setActiveTab('catches')}
                activeOpacity={0.9}
                style={styles.linkButton}
              >
                <Text style={styles.linkButtonText}>View all</Text>
                <Icon name="chevron-right" size={18} color={colors.accent} />
              </TouchableOpacity>
            </View>

            {!recentCatches.length ? (
              <EmptyState
                icon="phishing"
                title="No catches yet"
                message="Log a fish and your progress starts stacking up here."
              />
            ) : (
              <View style={styles.listCard}>
                {recentCatches.map((entry, idx) => (
                  <View key={entry.id} style={idx === 0 ? styles.firstCatchRow : null}>
                    <CatchCard
                      catchRecord={entry}
                      tournamentName={entry.tournamentName}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Joined Tournaments" subtitle="Active & past events you're in" />
            {!joinedTournamentList.length ? (
              <EmptyState
                icon="event-busy"
                title="No tournaments joined yet"
                message="Join an event to track your catches here."
              />
            ) : (
              <>
                {activeJoined.length ? (
                  <>
                    <SectionHeader title="Active" subtitle="Log fish inside the boundary" />
                    {activeJoined.map((entry) => (
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

                {pastJoined.length ? (
                  <>
                    <SectionHeader title="Past" subtitle="Completed tournaments" />
                    {pastJoined.map((entry) => (
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
          </View>
        </>
      ) : (
        <>
          {personalBests.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Personal Bests" subtitle="Trophy catches by species" />
              <View style={styles.bestsCard}>
                {personalBests.map((best, idx) => (
                  <View
                    key={best.species}
                    style={[
                      styles.bestRow,
                      idx === 0 && styles.bestRowFirst,
                      idx !== personalBests.length - 1 && styles.bestRowWithBorder,
                    ]}
                  >
                    <View style={styles.bestLeft}>
                      <View style={[styles.trophyBadge, idx === 0 && styles.trophyBadgeGold]}>
                        <Icon
                          name={idx === 0 ? 'emoji-events' : 'pets'}
                          size={18}
                          color={idx === 0 ? '#fbbf24' : colors.accent}
                        />
                      </View>
                      <View style={styles.bestInfo}>
                        <Text style={styles.bestSpecies}>{best.species}</Text>
                        <Text style={styles.bestTournament} numberOfLines={1}>
                          {best.tournamentName}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bestLength}>
                      <Text style={styles.bestLengthValue}>{best.length.toFixed(2)}"</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              title="My Catches"
              subtitle={
                myCatches.length
                  ? `${myCatches.length} ${myCatches.length === 1 ? 'catch' : 'catches'} logged`
                  : 'Your submissions across tournaments'
              }
            />
            {!myCatches.length ? (
              <EmptyState
                icon="phishing"
                title="No catches yet"
                message="Join a tournament and log your first catch to start building your angler profile."
              >
                <View style={styles.emptyStats}>
                  <Text style={styles.emptyStatsText}>Track • Compete • Win</Text>
                </View>
              </EmptyState>
            ) : (
              <View style={styles.listCard}>
                {myCatches.map((entry, idx) => (
                  <View key={entry.id} style={idx === 0 ? styles.firstCatchRow : null}>
                    <CatchCard
                      catchRecord={entry}
                      tournamentName={entry.tournamentName}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
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
  headerCard: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.textHighlight,
    marginTop: spacing.xs / 2,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  devCard: {
    padding: spacing.lg,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  devLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  devTextBlock: {
    flex: 1,
    gap: 2,
  },
  devTitle: {
    ...typography.subtitle,
    color: colors.textHighlight,
    fontWeight: '800',
  },
  devSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  devButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neonBlue,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  devButtonText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(51, 183, 146, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(51, 183, 146, 0.25)',
  },
  linkButtonText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  emptyStats: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  emptyStatsText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  firstCatchRow: {
    marginTop: -1,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  resultsCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  resultsRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  resultBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    ...typography.subtitle,
    color: colors.textHighlight,
    fontWeight: '700',
  },
  resultSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  resultRight: {
    alignItems: 'flex-end',
    gap: 2,
    marginLeft: spacing.md,
  },
  resultPlacement: {
    ...typography.title,
    fontSize: 18,
    color: colors.textHighlight,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  resultPrize: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  quickStatsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs / 2,
  },
  statValue: {
    ...typography.title,
    fontSize: 22,
    color: colors.accent,
    fontWeight: '900',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
  },
  bestsCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bestRowFirst: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  bestRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  trophyBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyBadgeGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#fbbf24',
  },
  bestInfo: {
    flex: 1,
    gap: 2,
  },
  bestSpecies: {
    ...typography.subtitle,
    color: colors.textHighlight,
    fontWeight: '700',
  },
  bestTournament: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  bestLength: {
    alignItems: 'flex-end',
  },
  bestLengthValue: {
    ...typography.title,
    fontSize: 20,
    color: colors.accent,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});
