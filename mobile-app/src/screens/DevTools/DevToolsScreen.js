import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import useUserLocation from '../../hooks/useUserLocation';
import SectionHeader from '../../components/ui/SectionHeader';
import Card from '../../components/ui/Card';
import Banner from '../../components/ui/Banner';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { colors, radius, spacing, typography } from '../../styles/tokens';

const STORAGE_KEYS = {
  catches: '@fish_tourney_catches_v1',
  joined: '@fish_tourney_joined_tournaments_v2',
};

export default function DevToolsScreen() {
  const { presets, activePresetId, setActivePresetId, locationLabel, currentState, regionLabel } =
    useUserLocation();
  const [isBusy, setIsBusy] = useState(false);

  const presetRows = useMemo(() => presets ?? [], [presets]);

  async function clearStorage(keys) {
    setIsBusy(true);
    try {
      await AsyncStorage.multiRemove(keys);
      Alert.alert('Cleared', 'Local test data cleared.');
    } catch (error) {
      console.error('Failed clearing storage', error);
      Alert.alert('Error', 'Failed to clear local storage.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Dev Tools</Text>
            <Text style={styles.subtitle}>Reset state and simulate locations</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="build" size={18} color={colors.background} />
          </View>
        </View>
        <Banner
          variant="info"
          message={`Current preset: ${locationLabel} • ${regionLabel ?? ''} • ${currentState ?? ''}`}
        />
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Reset Local Data" subtitle="For repeatable tester missions" />
        <Card variant="muted" style={styles.card}>
          <PrimaryButton
            label="Clear catches"
            icon="delete"
            variant="secondary"
            disabled={isBusy}
            onPress={() => clearStorage([STORAGE_KEYS.catches])}
          />
          <PrimaryButton
            label="Clear joined tournaments"
            icon="delete-forever"
            variant="secondary"
            disabled={isBusy}
            onPress={() => clearStorage([STORAGE_KEYS.joined])}
          />
          <PrimaryButton
            label="Clear ALL local data"
            icon="delete-sweep"
            disabled={isBusy}
            onPress={() => clearStorage([STORAGE_KEYS.catches, STORAGE_KEYS.joined])}
          />
          <Text style={styles.hint}>
            Tip: after clearing, fully close and reopen the app if a screen still shows cached UI.
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Location Preset" subtitle="Simulate boundary eligibility" />
        <Card variant="muted" style={styles.card}>
          {presetRows.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetRow, isActive && styles.presetRowActive]}
                activeOpacity={0.85}
                onPress={() => setActivePresetId(preset.id)}
              >
                <View style={styles.presetLeft}>
                  <Icon
                    name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22}
                    color={isActive ? colors.accent : colors.textMuted}
                  />
                  <View style={styles.presetInfo}>
                    <Text style={[styles.presetTitle, isActive && styles.presetTitleActive]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.presetMeta}>
                      {preset.regionLabel} • {preset.state}
                    </Text>
                  </View>
                </View>
                {isActive ? <Icon name="check" size={20} color={colors.accent} /> : null}
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  headerCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.title,
    color: colors.textHighlight,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  presetRowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceHighlight,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  presetInfo: {
    flex: 1,
    gap: 2,
  },
  presetTitle: {
    ...typography.subtitle,
    color: colors.textHighlight,
    fontWeight: '700',
  },
  presetTitleActive: {
    color: colors.accent,
  },
  presetMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
});



