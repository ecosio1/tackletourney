import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../styles/tokens';
import StatPill from './StatPill';

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

function getStatusVariant(status = '') {
  switch (status.toLowerCase()) {
    case 'active':
    case 'ongoing':
      return {
        label: 'Active',
        backgroundColor: '#0f766e',
        textColor: '#f0fdfa',
      };
    case 'upcoming':
      return {
        label: 'Upcoming',
        backgroundColor: '#1d4ed8',
        textColor: '#dbeafe',
      };
    case 'completed':
      return {
        label: 'Completed',
        backgroundColor: '#374151',
        textColor: '#e5e7eb',
      };
    default:
      return {
        label: status || 'Scheduled',
        backgroundColor: colors.surfaceMuted,
        textColor: colors.textHighlight,
      };
  }
}

export default function TournamentCard({
  tournament,
  onPress,
  joined,
  showJoinBadge = true,
  scopeLabel,
}) {
  const prizePool = Number.parseFloat(tournament.prize_pool ?? 0);
  const entryFee = Number.parseFloat(tournament.entry_fee ?? 0);

  const status = getStatusVariant(tournament.status);
  const timeRemaining = formatTimeRemaining(tournament.end_time);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.headerRow}>
        <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
          <Text style={[styles.statusLabel, { color: status.textColor }]}>
            {status.label}
          </Text>
        </View>
        <Text style={styles.timeRemaining}>{timeRemaining}</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{tournament.name}</Text>
        {scopeLabel ? <Text style={styles.scope}>{scopeLabel}</Text> : null}
        <Text style={styles.species}>
          Target: {Array.isArray(tournament.species) ? tournament.species.join(', ') : tournament.species}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatPill
          icon="attach-money"
          label="Prize Pool"
          value={prizePool > 0 ? `$${prizePool.toLocaleString()}` : 'Free'}
        />
        <StatPill
          icon="sell"
          label="Entry Fee"
          value={entryFee > 0 ? `$${entryFee}` : 'Free'}
        />
        <StatPill
          icon="groups"
          label="Anglers"
          value={tournament.participant_count ?? 0}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.locationRow}>
          <Icon name="place" size={16} color={colors.textMuted} />
          <Text style={styles.locationText}>{tournament.region}</Text>
        </View>
        {joined && showJoinBadge ? (
          <View style={styles.joinedBadge}>
            <Icon name="check-circle" size={16} color={colors.background} />
            <Text style={styles.joinedLabel}>Joined</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  statusLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  timeRemaining: {
    ...typography.caption,
    color: colors.warning,
  },
  titleBlock: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textHighlight,
    marginBottom: 4,
  },
  scope: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs / 2,
  },
  species: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.pill,
  },
  joinedLabel: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
  },
});

