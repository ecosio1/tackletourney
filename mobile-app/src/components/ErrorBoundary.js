import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing, typography } from '../styles/tokens';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // eslint-disable-next-line no-console
    console.error('App render error:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>App crashed while rendering</Text>
          <Text style={styles.subtitle}>
            Copy the error message below and send it to Cursor so we can fix it.
          </Text>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Message</Text>
            <Text style={styles.mono}>{String(error?.message ?? error)}</Text>
          </View>

          {errorInfo?.componentStack ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Component Stack</Text>
              <Text style={styles.mono}>{errorInfo.componentStack}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.danger,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  block: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  blockTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.textHighlight,
    lineHeight: 18,
  },
});




