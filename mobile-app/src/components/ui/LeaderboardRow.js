import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

function formatSubmittedTime(iso) {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
}

function getStatusBadge(status) {
  if (status === 'pending') {
    return {
      label: 'Pending',
      icon: 'schedule',
      color: '#f59e0b',
      bgColor: '#fef3c7',
    };
  }
  if (status === 'verified') {
    return {
      label: 'Verified',
      icon: 'verified',
      color: colors.accent,
      bgColor: '#d1fae5',
    };
  }
  return null;
}

export default function LeaderboardRow({ entry }) {
  const isYou = Boolean(entry?.isCurrentUser);
  const angler = isYou ? 'You' : entry?.angler ?? 'Unknown';
  const statusBadge = getStatusBadge(entry?.status);
  const lengthInches = Number(entry.length_in).toFixed(2);

  return (
    <View style={[styles.row, isYou && styles.rowYou]}>
      <View style={styles.rankCell}>
        {isYou ? (
          <View style={styles.rankBadge}>
            <Icon name="bolt" size={14} color={colors.background} />
            <Text style={styles.rankBadgeText}>#{entry.rank}</Text>
          </View>
        ) : (
          <Text style={styles.rankText}>#{entry.rank}</Text>
        )}
      </View>

      <View style={styles.mainCell}>
        <View style={styles.anglerRow}>
          <Text style={[styles.anglerText, isYou && styles.anglerTextYou]} numberOfLines={1}>
            {angler}
          </Text>
          {statusBadge && (
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
              <Icon name={statusBadge.icon} size={10} color={statusBadge.color} />
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.fishText} numberOfLines={1}>
            {entry.fish}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.timeText}>{formatSubmittedTime(entry.submitted_at)}</Text>
        </View>
      </View>

      <View style={styles.lengthCell}>
        <Text style={[styles.lengthText, isYou && styles.lengthTextYou]}>
          {lengthInches}"
        </Text>
        <Text style={styles.lengthLabel}>inches</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  rowYou: {
    backgroundColor: 'rgba(51, 183, 146, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  rankCell: {
    width: 64,
    alignItems: 'center',
  },
  rankText: {
    ...typography.title,
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 18,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  rankBadgeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  mainCell: {
    flex: 1,
    gap: 4,
  },
  anglerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  anglerText: {
    ...typography.subtitle,
    color: colors.textHighlight,
    fontWeight: '700',
    fontSize: 15,
  },
  anglerTextYou: {
    color: colors.accent,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fishText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  separator: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  timeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  lengthCell: {
    alignItems: 'flex-end',
    gap: 2,
  },
  lengthText: {
    ...typography.title,
    color: colors.accent,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  lengthTextYou: {
    color: colors.accent,
    textShadowColor: 'rgba(51, 183, 146, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  lengthLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});


