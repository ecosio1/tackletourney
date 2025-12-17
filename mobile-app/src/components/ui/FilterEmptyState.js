import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

export default function FilterEmptyState({ onClearFilters, onChangeLocation }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="search-off" size={48} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>No tournaments found</Text>
      <Text style={styles.subtitle}>
        Try adjusting your filters or changing your location to see more tournaments.
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={onClearFilters}
          activeOpacity={0.7}
        >
          <Icon name="filter-list-off" size={18} color={colors.background} />
          <Text style={styles.buttonTextPrimary}>Clear Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onChangeLocation}
          activeOpacity={0.7}
        >
          <Icon name="location-on" size={18} color={colors.accent} />
          <Text style={styles.buttonTextSecondary}>Change Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 1.5,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    color: colors.textHighlight,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: 6,
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonTextPrimary: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: colors.background,
  },
  buttonTextSecondary: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
});
