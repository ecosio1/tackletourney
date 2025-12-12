import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import { getTournamentLifecycle, TOURNAMENT_LIFECYCLE } from '../../utils/tournament-lifecycle';

function formatStartDate(startTime) {
  if (!startTime) {
    return 'Starts: TBA';
  }

  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) {
    return 'Starts: TBA';
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) {
    return `Today at ${date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  }

  if (isTomorrow) {
    return `Tomorrow at ${date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatEndLabel(endTime) {
  if (!endTime) {
    return 'Ends: TBA';
  }

  const date = new Date(endTime);
  if (Number.isNaN(date.getTime())) {
    return 'Ends: TBA';
  }

  return `Ends ${date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;
}

function formatTimeRemaining(endTime) {
  if (!endTime) {
    return 'Schedule pending';
  }

  const now = Date.now();
  const end = new Date(endTime).getTime();

  if (Number.isNaN(end)) {
    return 'Schedule pending';
  }

  const diffMs = end - now;

  if (diffMs <= 0) {
    return 'Ended';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

  if (diffHours <= 0) {
    return `${diffMinutes}m remaining`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ${diffMinutes}m remaining`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ${diffHours % 24}h remaining`;
}

function getStatusConfig(lifecycle) {
  if (lifecycle === TOURNAMENT_LIFECYCLE.LIVE) {
    return {
      label: 'LIVE',
      pillBg: 'rgba(51, 183, 146, 0.25)',
      pillBorder: 'rgba(51, 183, 146, 0.55)',
      pillText: colors.accent,
    };
  }
  if (lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON) {
    return {
      label: 'ENDING SOON',
      pillBg: 'rgba(250, 204, 21, 0.18)',
      pillBorder: 'rgba(250, 204, 21, 0.35)',
      pillText: colors.warning,
    };
  }
  if (lifecycle === TOURNAMENT_LIFECYCLE.ENDED) {
    return {
      label: 'ENDED',
      pillBg: 'rgba(148, 163, 184, 0.18)',
      pillBorder: 'rgba(148, 163, 184, 0.25)',
      pillText: colors.textMuted,
    };
  }
  if (lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED) {
    return {
      label: 'ARCHIVED',
      pillBg: 'rgba(17, 24, 39, 0.50)',
      pillBorder: 'rgba(148, 163, 184, 0.18)',
      pillText: '#9ca3af',
    };
  }
  return {
    label: 'UPCOMING',
    pillBg: 'rgba(34, 211, 238, 0.18)',
    pillBorder: 'rgba(34, 211, 238, 0.35)',
    pillText: colors.neonBlue,
  };
}

function getTournamentImageUrl(tournament) {
  const seed = tournament?.id ?? tournament?.region ?? tournament?.name ?? 'tournament';
  return `https://picsum.photos/seed/fish-tourney-${encodeURIComponent(String(seed))}/900/520`;
}

function getLocationCode(value, fallback) {
  const cleaned = String(value ?? '').trim();
  if (!cleaned) {
    return fallback;
  }

  const upper = cleaned.toUpperCase();

  const presets = [
    ['TAMPA BAY', 'TAM'],
    ['SOUTHWEST FLORIDA', 'SWFL'],
    ['FLORIDA PANHANDLE', 'PNH'],
    ['PANHANDLE', 'PNH'],
    ['PENSACOLA', 'PNS'],
    ['NAPLES', 'NAP'],
    ['LAKE OKEECHOBEE', 'OKB'],
    ['OKEECHOBEE', 'OKB'],
    ['FLORIDA KEYS', 'KEYS'],
    ['KEYS', 'KEYS'],
  ];

  const presetMatch = presets.find(([needle]) => upper.includes(needle));
  if (presetMatch) {
    return presetMatch[1];
  }

  if (/^[A-Z]{2,4}$/.test(upper)) {
    return upper;
  }

  const parts = upper.split(/[\s,.-]+/).filter(Boolean);
  if (!parts.length) {
    return fallback;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 4);
  }

  const joined = parts.slice(0, 4).map((p) => p[0]).join('');
  return joined || parts[0].slice(0, 4) || fallback;
}

function getScopeCode(scopeLevel) {
  const scope = String(scopeLevel ?? '').toUpperCase();
  if (scope === 'STATE') {
    return 'STWD';
  }
  if (scope === 'RADIUS') {
    return 'RAD';
  }
  if (scope === 'REGION') {
    return 'REG';
  }
  if (scope === 'LOCAL') {
    return 'LOC';
  }
  return 'EVNT';
}

function getCodeTextStyle(code) {
  const len = String(code ?? '').length;
  if (len >= 5) {
    return { fontSize: 20, letterSpacing: -0.4 };
  }
  if (len === 4) {
    return { fontSize: 22, letterSpacing: -0.5 };
  }
  return null;
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={16} color={colors.textSecondary} />
      </View>
      <Text style={styles.infoLabel} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
      <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

export default function TournamentCard({
  tournament,
  onPress,
  joined,
  showJoinBadge = true,
  scopeLabel,
}) {
  const lifecycle = useMemo(() => getTournamentLifecycle(tournament), [tournament]);
  const status = useMemo(() => getStatusConfig(lifecycle), [lifecycle]);

  const mountProgress = useRef(new Animated.Value(0)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(0)).current;
  const livePulseLoopRef = useRef(null);

  useEffect(() => {
    Animated.timing(mountProgress, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [mountProgress]);

  useEffect(() => {
    if (lifecycle !== TOURNAMENT_LIFECYCLE.LIVE) {
      if (livePulseLoopRef.current) {
        livePulseLoopRef.current.stop();
        livePulseLoopRef.current = null;
      }
      livePulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );

    livePulseLoopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      livePulseLoopRef.current = null;
    };
  }, [lifecycle, livePulse]);

  const prizePool = Number.parseFloat(tournament.prize_pool ?? 0);
  const entryFee = Number.parseFloat(tournament.entry_fee ?? 0);

  const timeRemaining = formatTimeRemaining(tournament.end_time);
  const startDate = formatStartDate(tournament.start_time);
  const endLabel = formatEndLabel(tournament.end_time);

  const locationCode = getLocationCode(
    tournament.regionName ?? tournament.region ?? scopeLabel,
    getLocationCode(tournament.state, '—')
  );
  const scopeCode = getScopeCode(tournament.scopeLevel ?? tournament.geoBoundary?.type);
  const eventCode = getLocationCode(tournament.id, '—');

  const animatedOpacity = mountProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const animatedTranslateY = mountProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const animatedScale = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.985],
  });

  const timeColor =
    lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON
      ? colors.warning
      : lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED
      ? colors.textMuted
      : colors.warning;

  const liveDotScale = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.25],
  });
  const liveDotOpacity = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedOpacity,
          transform: [{ translateY: animatedTranslateY }, { scale: animatedScale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(pressProgress, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 0,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(pressProgress, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 0,
          }).start();
        }}
        onHoverIn={() => {
          if (Platform.OS !== 'web') {
            return;
          }
          Animated.spring(pressProgress, {
            toValue: 1,
            useNativeDriver: true,
            speed: 18,
            bounciness: 2,
          }).start();
        }}
        onHoverOut={() => {
          if (Platform.OS !== 'web') {
            return;
          }
          Animated.spring(pressProgress, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 2,
          }).start();
        }}
        style={styles.pressable}
      >
        <ImageBackground
          source={{ uri: getTournamentImageUrl(tournament) }}
          style={styles.image}
          imageStyle={styles.imageInner}
        >
          <View style={styles.imageOverlay} />
          <View style={styles.topRow}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: status.pillBg, borderColor: status.pillBorder },
              ]}
            >
              {lifecycle === TOURNAMENT_LIFECYCLE.LIVE ? (
                <Animated.View
                  style={[
                    styles.liveDot,
                    { opacity: liveDotOpacity, transform: [{ scale: liveDotScale }] },
                  ]}
                />
              ) : null}
              <Text style={[styles.statusText, { color: status.pillText }]}>{status.label}</Text>
            </View>
            <View style={styles.topRight}>
              <Text style={[styles.timeRemaining, { color: timeColor }]}>{timeRemaining}</Text>
              {joined && showJoinBadge ? (
                <View style={styles.joinedChip}>
                  <Icon name="check-circle" size={14} color={colors.background} />
                  <Text style={styles.joinedChipText}>Joined</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={2}>
              {tournament.name}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {scopeLabel ?? tournament.regionName ?? tournament.scopeLevel ?? 'Tournament'}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.routeRow}>
            <View style={styles.routeColLeft}>
              <Text style={styles.routeTime}>{startDate}</Text>
              <Text style={[styles.routeCode, getCodeTextStyle(locationCode)]}>{locationCode}</Text>
              <Text style={styles.routeCity} numberOfLines={1}>
                {tournament.regionName ?? tournament.region ?? '—'}
              </Text>
            </View>

            <View style={styles.routeColCenter}>
              <Text style={styles.routeMeta}>{eventCode}</Text>
              <View style={styles.routeLineRow}>
                <View style={styles.routeLine} />
                <View style={styles.routeIconBadge}>
                  <Icon name="phishing" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.routeLine} />
              </View>
              <Text style={styles.routeDuration}>{timeRemaining}</Text>
            </View>

            <View style={styles.routeColRight}>
              <Text style={styles.routeTime}>{endLabel}</Text>
              <Text style={[styles.routeCode, getCodeTextStyle(scopeCode)]}>{scopeCode}</Text>
              <Text style={styles.routeCity} numberOfLines={1}>
                {Array.isArray(tournament.species) ? tournament.species.join(', ') : tournament.species}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <InfoItem
              icon="attach-money"
              label="Prize"
              value={prizePool > 0 ? `$${prizePool.toLocaleString()}` : 'Free'}
            />
            <InfoItem
              icon="sell"
              label="Entry"
              value={entryFee > 0 ? `$${entryFee}` : 'Free'}
            />
            <InfoItem
              icon="groups"
              label="Anglers"
              value={String(tournament.participant_count ?? 0)}
            />
          </View>

          <View style={styles.locationRow}>
            <Icon name="place" size={16} color={colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {tournament.region}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
  pressable: {
    width: '100%',
  },
  image: {
    height: 120,
    width: '100%',
    justifyContent: 'space-between',
  },
  imageInner: {
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.45)',
  },
  topRow: {
    padding: spacing.sm,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  topRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '900',
    letterSpacing: 1,
  },
  timeRemaining: {
    ...typography.caption,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  joinedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  joinedChipText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  body: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  routeColLeft: {
    flex: 1,
    gap: 2,
  },
  routeColCenter: {
    width: 104,
    alignItems: 'center',
    gap: 4,
  },
  routeColRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  routeTime: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  routeCode: {
    ...typography.heading,
    fontSize: 26,
    color: colors.textPrimary,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  routeCity: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  routeMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  routeLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.borderMuted,
    opacity: 0.8,
  },
  routeIconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDuration: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 0,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs / 2,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  infoValue: {
    ...typography.subtitle,
    color: colors.textHighlight,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
});


