import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '../../styles/tokens';

export default function Card({
  children,
  variant = 'surface',
  style,
  withBorder = true,
  withShadow = false,
}) {
  return (
    <View
      style={[
        styles.base,
        variant === 'muted' && styles.muted,
        variant === 'highlight' && styles.highlight,
        withBorder && styles.border,
        withShadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
  highlight: {
    backgroundColor: colors.surfaceHighlight,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  shadow: {
    ...shadows.card,
  },
});



