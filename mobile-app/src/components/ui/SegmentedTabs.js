import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

export default function SegmentedTabs({ value, items, onChange }) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            {item.icon ? (
              <Icon
                name={item.icon}
                size={16}
                color={isActive ? colors.background : colors.textMuted}
              />
            ) : null}
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.background,
  },
});



