import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'live', label: 'Live', icon: 'radio-button-checked' },
  { id: 'registering', label: 'Registering', icon: 'how-to-reg' },
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'thisWeek', label: 'This Week', icon: 'date-range' },
  { id: 'nearMe', label: 'Near Me', icon: 'near-me' },
];

export default function FilterChips({ selectedFilter = 'all', onFilterSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {FILTER_OPTIONS.map((filter) => {
        const isSelected = selectedFilter === filter.id;
        return (
          <TouchableOpacity
            key={filter.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onFilterSelect(filter.id)}
            activeOpacity={0.7}
          >
            {filter.icon && (
              <Icon
                name={filter.icon}
                size={16}
                color={isSelected ? colors.background : colors.textSecondary}
                style={styles.chipIcon}
              />
            )}
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginBottom: spacing.md,
  },
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipIcon: {
    opacity: 0.85,
  },
  chipText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textHighlight,
  },
  chipTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
});
