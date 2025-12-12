import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

const VARIANTS = {
  success: {
    icon: 'check-circle',
    borderColor: colors.accent,
    backgroundColor: 'rgba(20, 83, 45, 0.20)',
    iconColor: colors.accent,
    textColor: colors.textHighlight,
  },
  warning: {
    icon: 'warning',
    borderColor: colors.warning,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    iconColor: colors.warning,
    textColor: colors.textHighlight,
  },
  danger: {
    icon: 'error-outline',
    borderColor: colors.danger,
    backgroundColor: 'rgba(127, 29, 29, 0.20)',
    iconColor: colors.danger,
    textColor: colors.textHighlight,
  },
  info: {
    icon: 'info',
    borderColor: colors.neonBlue,
    backgroundColor: 'rgba(34, 211, 238, 0.10)',
    iconColor: colors.neonBlue,
    textColor: colors.textHighlight,
  },
};

export default function Banner({ variant = 'info', icon, message }) {
  const config = VARIANTS[variant] ?? VARIANTS.info;
  return (
    <View style={[styles.container, { borderColor: config.borderColor, backgroundColor: config.backgroundColor }]}>
      <Icon name={icon ?? config.icon} size={18} color={config.iconColor} />
      <Text style={[styles.message, { color: config.textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  message: {
    ...typography.body,
    flex: 1,
  },
});


