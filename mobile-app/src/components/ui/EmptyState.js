import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';
import Card from './Card';

export default function EmptyState({
  icon = 'info',
  title,
  message,
  emphasis = 'muted',
  children,
}) {
  return (
    <Card variant={emphasis === 'muted' ? 'muted' : 'surface'} style={styles.card}>
      <Icon name={icon} size={34} color={colors.textMuted} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children ? <View style={styles.footer}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  title: {
    ...typography.subtitle,
    color: colors.textHighlight,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.xs,
  },
});



