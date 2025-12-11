import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

const ICON_SIZE = 20;

export default function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
  variant = 'primary',
}) {
  const variantStyles = stylesByVariant[variant] ?? stylesByVariant.primary;

  const content = (
    <>
      {icon ? (
        <View style={styles.iconWrapper}>
          <Icon name={icon} size={ICON_SIZE} color={variantStyles.iconColor} />
        </View>
      ) : null}
      <Text style={[styles.label, variantStyles.label]}>{label}</Text>
    </>
  );

  if (disabled) {
    return (
      <View style={[styles.button, variantStyles.button, styles.disabled]}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, variantStyles.button]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {content}
    </TouchableOpacity>
  );
}

const baseButton = {
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: spacing.xs,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  borderRadius: radius.md,
};

const stylesByVariant = {
  primary: {
    button: {
      backgroundColor: colors.accent,
    },
    label: {
      color: colors.background,
    },
    iconColor: colors.background,
  },
  secondary: {
    button: {
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      color: colors.textHighlight,
    },
    iconColor: colors.textHighlight,
  },
  ghost: {
    button: {
      backgroundColor: 'transparent',
    },
    label: {
      color: colors.textSecondary,
    },
    iconColor: colors.textSecondary,
  },
};

const styles = StyleSheet.create({
  button: {
    ...baseButton,
  },
  label: {
    ...typography.subtitle,
    textTransform: 'uppercase',
  },
  iconWrapper: {
    paddingRight: spacing.xs / 2,
  },
  disabled: {
    opacity: 0.45,
  },
});

