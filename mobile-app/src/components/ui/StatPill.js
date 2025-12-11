import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

export default function StatPill({ icon, label, value, emphasis = 'default' }) {
  return (
    <View style={[styles.container, emphasis === 'accent' && styles.containerAccent]}>
      {icon ? (
        <Icon
          name={icon}
          size={18}
          color={emphasis === 'accent' ? colors.background : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <View style={styles.content}>
        <Text
          style={[
            styles.value,
            emphasis === 'accent' && styles.valueAccent,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    minWidth: 96,
  },
  containerAccent: {
    backgroundColor: colors.accent,
  },
  icon: {
    marginRight: spacing.xs,
  },
  content: {
    flex: 1,
  },
  value: {
    ...typography.subtitle,
    fontSize: 16,
    color: colors.textHighlight,
  },
  valueAccent: {
    color: colors.background,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 2,
    color: colors.textMuted,
  },
});

