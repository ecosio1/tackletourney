import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

function formatCatchTime(iso) {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return '';
  }
}

function getStatusInfo(status) {
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

export default function CatchCard({ catchRecord, tournamentName }) {
  const length = Number(catchRecord?.length);
  const statusInfo = getStatusInfo(catchRecord?.status);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.iconPill, catchRecord?.status === 'pending' && styles.iconPillPending]}>
          <Icon
            name={catchRecord?.status === 'pending' ? 'schedule' : 'phishing'}
            size={18}
            color={colors.background}
          />
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.titleRow}>
          <Text style={styles.species} numberOfLines={1}>
            {catchRecord?.species ?? 'Unknown'}
          </Text>
          {statusInfo && (
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Icon name={statusInfo.icon} size={9} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.tournament} numberOfLines={1}>
          {tournamentName ?? catchRecord?.tournamentId}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatCatchTime(catchRecord?.createdAt)}
          {catchRecord?.location?.regionName && ` • ${catchRecord.location.regionName}`}
        </Text>
      </View>

      <View style={styles.lengthContainer}>
        <Text style={styles.lengthValue}>
          {Number.isFinite(length) ? length.toFixed(2) : '--'}
        </Text>
        <Text style={styles.lengthUnit}>inches</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  left: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillPending: {
    backgroundColor: '#f59e0b',
  },
  main: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  species: {
    ...typography.subtitle,
    color: colors.textHighlight,
    fontWeight: '700',
    fontSize: 15,
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
  tournament: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  lengthContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  lengthValue: {
    ...typography.title,
    fontSize: 18,
    color: colors.accent,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  lengthUnit: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});