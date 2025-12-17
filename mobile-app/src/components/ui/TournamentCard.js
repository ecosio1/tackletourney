import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import { getTournamentLifecycle, TOURNAMENT_LIFECYCLE } from '../../utils/tournament-lifecycle';

function formatShortTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDayAndTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return { prefix: 'Today', time };
  }

  if (isTomorrow) {
    return { prefix: 'Tomorrow', time };
  }

  const day = date.toLocaleString(undefined, { month: 'short', day: 'numeric' });
  return { prefix: day, time };
}

function formatEndedTime(endTime) {
  if (!endTime) {
    return null;
  }

  const date = new Date(endTime);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // Format: "Ended Dec 16, 10:32 PM"
  const dateStr = date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return `Ended ${dateStr}`;
}

function formatTimeRemaining(endTime) {
  if (!endTime) {
    return { text: null, urgent: false };
  }

  const now = Date.now();
  const end = new Date(endTime).getTime();

  if (Number.isNaN(end)) {
    return { text: null, urgent: false };
  }

  const diffMs = end - now;

  if (diffMs <= 0) {
    return { text: 'Ended', urgent: false };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(totalMinutes / 60);
  const diffMinutes = totalMinutes % 60;

  // Less than 1 hour: show "Xm remaining"
  if (diffHours <= 0) {
    return {
      text: `${diffMinutes}m remaining`,
      urgent: diffMinutes < 10,
    };
  }

  // Less than 24 hours: show "Xh Ym remaining"
  if (diffHours < 24) {
    return {
      text: `${diffHours}h ${diffMinutes}m remaining`,
      urgent: false,
    };
  }

  // 24+ hours: show "Xd Xh remaining"
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  return {
    text: `${diffDays}d ${remainingHours}h remaining`,
    urgent: false,
  };
}

function getStatusConfig(lifecycle) {
  if (lifecycle === TOURNAMENT_LIFECYCLE.LIVE) {
    return {
      label: 'LIVE',
      icon: 'radio-button-checked', // Icon for non-color indicator
      pillBg: 'rgba(51, 183, 146, 0.25)',
      pillBorder: 'rgba(51, 183, 146, 0.55)',
      pillText: colors.accent,
    };
  }
  if (lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON) {
    return {
      label: 'LIVE',
      icon: 'radio-button-checked', // Icon for non-color indicator
      pillBg: 'rgba(250, 204, 21, 0.18)',
      pillBorder: 'rgba(250, 204, 21, 0.35)',
      pillText: colors.warning,
    };
  }
  if (lifecycle === TOURNAMENT_LIFECYCLE.ENDED) {
    return {
      label: 'COMPLETED',
      icon: 'check-circle', // Icon for non-color indicator
      pillBg: 'rgba(148, 163, 184, 0.18)',
      pillBorder: 'rgba(148, 163, 184, 0.25)',
      pillText: colors.textMuted,
    };
  }
  if (lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED) {
    return {
      label: 'COMPLETED',
      icon: 'check-circle', // Icon for non-color indicator
      pillBg: 'rgba(17, 24, 39, 0.50)',
      pillBorder: 'rgba(148, 163, 184, 0.18)',
      pillText: '#9ca3af',
    };
  }
  return {
    label: 'UPCOMING',
    icon: 'schedule', // Icon for non-color indicator
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

function getPrimaryActionLabel(tournament, lifecycle, joined) {
  // Results button for completed tournaments
  if (lifecycle === TOURNAMENT_LIFECYCLE.ENDED || lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED) {
    return 'Results';
  }

  // If already joined, show View button
  if (joined) {
    return 'View';
  }

  // Check if tournament is full (prepare for future capacity field)
  const isFull = tournament.is_full ||
    (tournament.max_participants &&
     tournament.participant_count >= tournament.max_participants);

  if (isFull) {
    return 'Waitlist';
  }

  // Check if registration is open (prepare for future registration fields)
  const registrationClosed = tournament.registration_closed ||
    (tournament.registration_end_time &&
     new Date(tournament.registration_end_time) < new Date());

  if (registrationClosed && lifecycle === TOURNAMENT_LIFECYCLE.UPCOMING) {
    return 'View';
  }

  // Default: Register button
  return 'Register';
}

function getButtonDisabledState(tournament, lifecycle, label) {
  // Never disable Results or View buttons
  if (label === 'Results' || label === 'View') {
    return { disabled: false, reason: null };
  }

  // Check if registration hasn't opened yet
  if (tournament.registration_start_time) {
    const registrationStart = new Date(tournament.registration_start_time);
    const now = new Date();

    if (now < registrationStart) {
      const timeString = registrationStart.toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      return {
        disabled: true,
        reason: `Registration opens at ${timeString}`
      };
    }
  }

  // Check if registration is closed
  if (tournament.registration_end_time) {
    const registrationEnd = new Date(tournament.registration_end_time);
    const now = new Date();

    if (now > registrationEnd) {
      return {
        disabled: true,
        reason: 'Registration has closed'
      };
    }
  }

  return { disabled: false, reason: null };
}

function formatMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Free';
  }

  // Format with no decimal places by default (e.g., $1,200)
  return `$${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatParticipantCount(count) {
  const num = Number(count);
  if (!Number.isFinite(num) || num < 0) {
    return '0';
  }
  // Return integer without decimals
  return String(Math.floor(num));
}

/**
 * TournamentCard - Interactive card for displaying tournament information
 *
 * Tap Zones:
 * - Card body (anywhere except CTA button): Opens TournamentDetail
 * - CTA button: Opens relevant flow (Register/View/Results)
 * - Stats tiles: Not individually tappable
 *
 * Visual Feedback:
 * - Press state: Subtle scale (0.98x) and elevation change
 * - Ripple effect on Android
 * - Highlight overlay on press
 *
 * @param {Object} tournament - Tournament data
 * @param {Function} onPress - Handler for card tap (navigates to TournamentDetail)
 * @param {Function} onRegisterPress - Handler for Register button (deep link to registration)
 * @param {boolean} joined - Whether user has joined this tournament
 * @param {boolean} showJoinBadge - Whether to show "joined" badge
 * @param {string} scopeLabel - Label for tournament scope
 * @param {boolean} loading - Loading state for button
 * @param {string} currentLocation - Current location to hide duplicate location display
 */
export default function TournamentCard({
  tournament,
  onPress,
  onRegisterPress,
  joined,
  showJoinBadge = true,
  scopeLabel,
  loading = false,
  currentLocation = null,
}) {
  const lifecycle = useMemo(() => getTournamentLifecycle(tournament), [tournament]);
  const status = useMemo(() => getStatusConfig(lifecycle), [lifecycle]);

  const [currentTime, setCurrentTime] = React.useState(Date.now());

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

  // Update time every minute for LIVE/ENDING_SOON tournaments
  useEffect(() => {
    if (
      lifecycle !== TOURNAMENT_LIFECYCLE.LIVE &&
      lifecycle !== TOURNAMENT_LIFECYCLE.ENDING_SOON
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every 60 seconds

    return () => {
      clearInterval(interval);
    };
  }, [lifecycle]);

  const prizePool = Number.parseFloat(tournament.prize_pool ?? 0);
  const entryFee = Number.parseFloat(tournament.entry_fee ?? 0);

  const timeRemainingData = useMemo(
    () => formatTimeRemaining(tournament.end_time),
    [tournament.end_time, currentTime]
  );
  const startDay = formatDayAndTime(tournament.start_time);
  const endDay = formatDayAndTime(tournament.end_time);
  const endedTime = formatEndedTime(tournament.end_time);
  const startShortTime = formatShortTime(tournament.start_time);

  const locationCode = getLocationCode(
    tournament.regionName ?? tournament.region ?? scopeLabel,
    getLocationCode(tournament.state, '—')
  );
  const eventCode = tournament.code ?? tournament.tournament_code ?? null;
  const scopeCode = getScopeCode(tournament.scopeLevel ?? tournament.geoBoundary?.type);

  const primaryActionLabel = getPrimaryActionLabel(tournament, lifecycle, joined);
  const buttonState = getButtonDisabledState(tournament, lifecycle, primaryActionLabel);

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
    outputRange: [1, 0.98],
  });

  const animatedElevation = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 2],
  });

  const animatedShadowOpacity = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.15],
  });

  const liveDotScale = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.25],
  });
  const liveDotOpacity = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const headerTimeLabel =
    lifecycle === TOURNAMENT_LIFECYCLE.LIVE || lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON
      ? timeRemainingData.text
      : lifecycle === TOURNAMENT_LIFECYCLE.ENDED || lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED
      ? endedTime
      : startDay
      ? `${startDay.prefix} at ${startDay.time}`
      : null;

  const isTimeUrgent =
    (lifecycle === TOURNAMENT_LIFECYCLE.LIVE || lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON) &&
    timeRemainingData.urgent;

  // Build comprehensive screen reader label
  const buildAccessibilityLabel = () => {
    const parts = [];

    // Tournament name
    parts.push(tournament.name);

    // Status
    parts.push(status.label);

    // Time information
    if (headerTimeLabel) {
      parts.push(headerTimeLabel);
    }

    // Prize and Entry
    parts.push(`Prize ${formatMoney(prizePool)}`);
    parts.push(`Entry ${formatMoney(entryFee)}`);

    // Anglers
    const anglerCount = formatParticipantCount(tournament.participant_count);
    parts.push(`${anglerCount} ${Number.parseInt(anglerCount) === 1 ? 'angler' : 'anglers'}`);

    // Primary action
    parts.push(`button ${primaryActionLabel}`);

    return parts.join(', ');
  };

  const metaLeft =
    startDay ? `Starts ${startDay.prefix} at ${startDay.time}` : 'Starts: TBA';

  const metaRight =
    lifecycle === TOURNAMENT_LIFECYCLE.ENDED || lifecycle === TOURNAMENT_LIFECYCLE.ARCHIVED
      ? 'Finalized'
      : endDay
      ? `Ends ${endDay.prefix} at ${endDay.time}`
      : 'Ends: TBA';

  const speciesLabel = Array.isArray(tournament.species)
    ? tournament.species.join(', ')
    : String(tournament.species ?? '').trim();

  const locationLabel =
    String(tournament.region ?? '').trim() ||
    String(tournament.regionName ?? '').trim() ||
    [tournament.city, tournament.state].filter(Boolean).join(', ') ||
    '—';

  // Check if tournament location matches current location
  const shouldShowLocation = !currentLocation || locationLabel !== currentLocation;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedOpacity,
          transform: [{ translateY: animatedTranslateY }, { scale: animatedScale }],
          elevation: animatedElevation,
          shadowOpacity: animatedShadowOpacity,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          // Card tap opens TournamentDetail
          if (onPress) {
            onPress(tournament);
          }
        }}
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
        android_ripple={{
          color: 'rgba(148, 163, 184, 0.15)',
          borderless: false,
        }}
        accessibilityRole="button"
        accessibilityLabel={buildAccessibilityLabel()}
        accessibilityHint="Double tap to view tournament details"
      >
        {/* Press highlight overlay */}
        <Animated.View
          style={[
            styles.pressHighlight,
            {
              opacity: pressProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.08],
              }),
            },
          ]}
          pointerEvents="none"
        />
        <ImageBackground
          source={{ uri: getTournamentImageUrl(tournament) }}
          style={styles.header}
          imageStyle={styles.imageInner}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.78)']}
            locations={[0, 0.55, 1]}
            style={styles.headerGradient}
          />

          <View style={styles.headerTopRow}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: status.pillBg, borderColor: status.pillBorder },
              ]}
              accessible={true}
              accessibilityLabel={`Tournament status: ${status.label}`}
              accessibilityRole="text"
            >
              {lifecycle === TOURNAMENT_LIFECYCLE.LIVE || lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON ? (
                <Animated.View
                  style={[
                    styles.liveDot,
                    { opacity: liveDotOpacity, transform: [{ scale: liveDotScale }] },
                  ]}
                  accessibilityLabel="Live indicator"
                />
              ) : (
                <Icon
                  name={status.icon}
                  size={12}
                  color={status.pillText}
                  style={styles.statusIcon}
                  accessibilityLabel={`${status.label} icon`}
                />
              )}
              <Text
                style={[styles.statusText, { color: status.pillText }]}
                accessibilityLabel={status.label}
              >
                {status.label}
              </Text>
            </View>

            {headerTimeLabel ? (
              <View
                style={[
                  styles.headerTimePill,
                  isTimeUrgent && styles.headerTimePillUrgent,
                ]}
              >
                <Icon
                  name={status.label === 'LIVE' ? 'timer' : status.label === 'COMPLETED' ? 'flag' : 'event'}
                  size={14}
                  color={isTimeUrgent ? colors.warning : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.headerTimeText,
                    isTimeUrgent && styles.headerTimeTextUrgent,
                  ]}
                  numberOfLines={1}
                >
                  {headerTimeLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {tournament.name}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {scopeLabel ?? tournament.regionName ?? tournament.scopeLevel ?? 'Tournament'}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="schedule" size={14} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {metaLeft}
              </Text>
            </View>

            {eventCode ? (
              <View style={styles.metaCodeWrap}>
                <Text style={styles.metaCodeLabel}>Code</Text>
                <Text style={styles.metaCodeValue} numberOfLines={1}>
                  {String(eventCode).toUpperCase()}
                </Text>
              </View>
            ) : null}

            <View style={[styles.metaItem, styles.metaItemRight]}>
              <Icon name="flag" size={14} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {metaRight}
              </Text>
            </View>
          </View>

          {/* Primary row */}
          <View style={styles.primaryRow}>
            <View style={styles.primaryLeft}>
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{locationCode}</Text>
              </View>
              <View style={styles.scopePill}>
                <Text style={styles.scopePillText}>{scopeCode}</Text>
              </View>
            </View>

            <Pressable
              onPress={(e) => {
                // Stop event propagation to prevent card tap from firing
                if (e && e.stopPropagation) {
                  e.stopPropagation();
                }

                if (loading || buttonState.disabled) {
                  return;
                }

                // CTA button opens relevant flow
                // Register -> onRegisterPress (deep link to registration)
                // View/Results -> onPress (navigate to TournamentDetail)
                if (primaryActionLabel === 'Register' && onRegisterPress) {
                  onRegisterPress(tournament);
                } else if (onPress) {
                  onPress(tournament);
                }
              }}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && !buttonState.disabled && !loading && styles.ctaButtonPressed,
                (buttonState.disabled || loading) && styles.ctaButtonDisabled,
              ]}
              android_ripple={{
                color: 'rgba(11, 17, 32, 0.3)',
                borderless: false,
              }}
              accessibilityRole="button"
              accessibilityLabel={primaryActionLabel}
              accessibilityHint={buttonState.reason || undefined}
              disabled={buttonState.disabled || loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color={colors.textMuted} />
                  <Text style={[styles.ctaButtonText, styles.ctaButtonTextDisabled]}>
                    {primaryActionLabel}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={[
                      styles.ctaButtonText,
                      (buttonState.disabled || loading) && styles.ctaButtonTextDisabled,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {primaryActionLabel}
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={buttonState.disabled || loading ? colors.textMuted : colors.background}
                  />
                </>
              )}
            </Pressable>
          </View>

          {/* Details row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailsItem}>
              <Icon name="phishing" size={16} color={colors.textSecondary} />
              <Text style={styles.detailsText} numberOfLines={1}>
                {speciesLabel || 'Species TBA'}
              </Text>
            </View>
            {shouldShowLocation && (
              <View style={styles.detailsItem}>
                <Icon name="place" size={16} color={colors.textSecondary} />
                <Text style={styles.detailsText} numberOfLines={1}>
                  {locationLabel}
                </Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View
              style={styles.statCell}
              accessible={true}
              accessibilityLabel={`Prize ${formatMoney(prizePool)}`}
              accessibilityRole="text"
            >
              <Icon name="emoji-events" size={16} color={colors.textSecondary} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatMoney(prizePool)}</Text>
              <Text style={styles.statLabel}>Prize</Text>
            </View>
            <View
              style={styles.statCell}
              accessible={true}
              accessibilityLabel={`Entry fee ${formatMoney(entryFee)}`}
              accessibilityRole="text"
            >
              <Icon name="payments" size={16} color={colors.textSecondary} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatMoney(entryFee)}</Text>
              <Text style={styles.statLabel}>Entry</Text>
            </View>
            <View
              style={styles.statCell}
              accessible={true}
              accessibilityLabel={`${formatParticipantCount(tournament.participant_count)} ${
                Number.parseInt(formatParticipantCount(tournament.participant_count)) === 1 ? 'angler' : 'anglers'
              }`}
              accessibilityRole="text"
            >
              <Icon name="people" size={16} color={colors.textSecondary} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatParticipantCount(tournament.participant_count)}</Text>
              <Text style={styles.statLabel}>Anglers</Text>
            </View>
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
    marginHorizontal: spacing.lg,
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
    position: 'relative',
  },
  pressHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.lg,
    zIndex: 1,
  },
  header: {
    height: 148,
    width: '100%',
    justifyContent: 'space-between',
  },
  imageInner: {
    resizeMode: 'cover',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTopRow: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
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
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  headerTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(3, 7, 18, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    minWidth: 0,
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerTimePillUrgent: {
    backgroundColor: 'rgba(250, 204, 21, 0.22)',
    borderColor: 'rgba(250, 204, 21, 0.45)',
    borderWidth: 1.5,
  },
  headerTimeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  headerTimeTextUrgent: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '900',
    textShadowColor: 'rgba(250, 204, 21, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerTextBlock: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 4,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 24,
    lineHeight: 28,
    color: colors.textPrimary,
    fontWeight: '900',
    letterSpacing: -0.3,
    // Dynamic type support: wraps up to 2 lines (set via numberOfLines prop)
    flexShrink: 1,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    // Removed opacity for better contrast (WCAG AA)
    letterSpacing: 0.1,
  },
  body: {
    padding: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  metaItemRight: {
    justifyContent: 'flex-end',
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    // Removed opacity for better contrast (WCAG AA)
  },
  metaCodeWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surfaceMuted,
    minWidth: 76,
  },
  metaCodeLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  metaCodeValue: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  primaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  codePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(29, 44, 84, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  codePillText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  scopePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.18)',
  },
  scopePillText: {
    fontSize: 10,
    color: colors.neonBlue,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.65,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: colors.accentMuted,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderMuted,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  ctaButtonText: {
    ...typography.subtitle,
    color: colors.background,
    fontWeight: '900',
    // Dynamic type support: uses ellipsis only if text exceeds button width
    flexShrink: 1,
  },
  ctaButtonTextDisabled: {
    color: colors.textMuted,
  },
  detailsRow: {
    gap: spacing.xs,
  },
  detailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  detailsText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textHighlight,
    fontWeight: '500',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCell: {
    flex: 1,
    backgroundColor: 'rgba(21, 35, 71, 0.35)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  statIcon: {
    opacity: 0.5,
  },
  statValue: {
    ...typography.subtitle,
    fontSize: 18,
    lineHeight: 22,
    color: colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.4,
    // Using textMuted for better contrast (WCAG AA)
  },
});
