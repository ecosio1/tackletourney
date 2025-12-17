import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { tournamentAPI } from '../../services/api';
import useUserLocation from '../../hooks/useUserLocation';
import { useJoinedTournaments } from '../../state/joined-tournaments-context';
import TournamentCard from '../../components/ui/TournamentCard';
import SectionHeader from '../../components/ui/SectionHeader';
import FilterChips from '../../components/ui/FilterChips';
import SortDropdown from '../../components/ui/SortDropdown';
import FilterEmptyState from '../../components/ui/FilterEmptyState';
import { applyFilter } from '../../utils/tournament-filters';
import { sortTournaments } from '../../utils/tournament-sorting';
import { colors, radius, spacing, typography } from '../../styles/tokens';

const STATE_LABELS = {
  FL: 'Florida',
};

const SECTION_KEYS = ['statewide', 'nearby', 'other'];
const SECTION_EMPTY_ICONS = {
  statewide: 'info',
  nearby: 'location-searching',
  other: 'travel-explore',
};

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function getScopeLabel(tournament, fallback) {
  if (!tournament) {
    return fallback;
  }

  if (tournament.scopeLevel === 'STATE') {
    return 'Statewide coverage';
  }

  if (tournament.scopeLevel === 'RADIUS') {
    if (tournament.regionName) {
      return `${tournament.regionName} radius`;
    }
    return 'Radius boundary';
  }

  return tournament.regionName ?? tournament.scopeLevel ?? fallback;
}

export default function HomeScreen({ navigation }) {
  const {
    location,
    currentState,
    locationLabel,
    regionLabel,
    presets,
    setActivePresetId,
  } = useUserLocation();
  const { isTournamentJoined } = useJoinedTournaments();

  const [sectionedTournaments, setSectionedTournaments] = useState({
    statewide: [],
    nearby: [],
    other: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('endingSoon');

  useEffect(() => {
    loadTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, location.lat, location.lng]);

  const stateLabel = useMemo(
    () => STATE_LABELS[currentState] ?? currentState ?? 'Your State',
    [currentState]
  );

  const loadTournaments = useCallback(async () => {
    if (!currentState) {
      setSectionedTournaments({ statewide: [], nearby: [], other: [] });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    try {
      const [statewideResponse, nearbyResponse, allStateResponse] =
        await Promise.all([
          tournamentAPI.getTournaments({
            state: currentState,
            scopeLevel: 'STATE',
          }),
          tournamentAPI.getTournaments({
            state: currentState,
            lat: location.lat,
            lng: location.lng,
          }),
          tournamentAPI.getTournaments({
            state: currentState,
          }),
        ]);

      const statewide = uniqueById(statewideResponse.tournaments ?? []);
      const nearby = uniqueById(
        (nearbyResponse.tournaments ?? []).filter(
          (tournament) => tournament.scopeLevel !== 'STATE'
        )
      );

      const excludedIds = new Set([
        ...statewide.map((tournament) => tournament.id),
        ...nearby.map((tournament) => tournament.id),
      ]);

      const other = uniqueById(
        (allStateResponse.tournaments ?? []).filter(
          (tournament) => !excludedIds.has(tournament.id)
        )
      );

      setSectionedTournaments({
        statewide,
        nearby,
        other,
      });
    } catch (error) {
      console.error('Error loading tournaments:', error);
      setError('Unable to load tournaments right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentState, location.lat, location.lng]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTournaments();
  }, [loadTournaments]);

  const handleFilterSelect = useCallback((filterId) => {
    // Animate layout changes for smooth filtering
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedFilter(filterId);

    // If 'live' filter is selected, default to 'endingSoon' sort
    if (filterId === 'live') {
      setSelectedSort('endingSoon');
    }
  }, []);

  const handleSortChange = useCallback((sortId) => {
    // Animate layout changes for smooth sorting
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedSort(sortId);
  }, []);

  const handleClearFilters = useCallback(() => {
    // Animate layout changes when clearing filters
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedFilter('all');
  }, []);

  const handleChangeLocation = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading tournaments…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tournaments</Text>
          <TouchableOpacity
            style={styles.locationPicker}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Icon name="location-on" size={16} color={colors.accent} />
            <Text style={styles.locationPickerText}>{locationLabel}</Text>
            <Icon name="expand-more" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={20} color={colors.textHighlight} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        contentContainerStyle={styles.scrollContainer}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="error-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {SECTION_KEYS.map((key) => {
          const tournaments = sectionedTournaments[key] ?? [];
          const emptyIcon = SECTION_EMPTY_ICONS[key] ?? 'info';

          if (!tournaments.length) {
            if (key === 'other') {
              return null;
            }

            return (
              <View key={key} style={styles.sectionContainer}>
                <SectionHeader
                  title={
                    key === 'statewide'
                      ? `Statewide in ${stateLabel}`
                      : `Near You${regionLabel ? ` in ${regionLabel}` : ''}`
                  }
                  subtitle={
                    key === 'nearby'
                      ? 'Location-based eligibility enforced'
                      : undefined
                  }
                />
                <View style={styles.sectionEmpty}>
                  <Icon name={emptyIcon} size={20} color={colors.textMuted} />
                  <Text style={styles.sectionEmptyText}>
                    {key === 'statewide'
                      ? `No statewide tournaments available in ${stateLabel} right now.`
                      : 'No nearby tournaments match your area yet.'}
                  </Text>
                </View>
              </View>
            );
          }

          // Apply filters and sorting
          const filteredTournaments = applyFilter(tournaments, selectedFilter, location);
          const sortedTournaments = sortTournaments(filteredTournaments, selectedSort, location);

          return (
            <View key={key} style={styles.sectionContainer}>
              <SectionHeader
                title={
                  key === 'statewide'
                    ? `Statewide in ${stateLabel}`
                    : key === 'nearby'
                    ? `Near You${regionLabel ? ` in ${regionLabel}` : ''}`
                    : `Other Tournaments in ${stateLabel}`
                }
                subtitle={
                  key === 'nearby'
                    ? 'Location-based eligibility enforced'
                    : key === 'other'
                    ? 'Travel-ready event lineup'
                    : undefined
                }
              />

              {/* Filter and Sort Controls */}
              <View style={styles.filterSortRow}>
                <FilterChips
                  selectedFilter={selectedFilter}
                  onFilterSelect={handleFilterSelect}
                />
                <View style={styles.sortContainer}>
                  <SortDropdown
                    selectedSort={selectedSort}
                    onSortChange={handleSortChange}
                  />
                </View>
              </View>

              {sortedTournaments.length === 0 ? (
                <FilterEmptyState
                  onClearFilters={handleClearFilters}
                  onChangeLocation={handleChangeLocation}
                />
              ) : (
                sortedTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onPress={() =>
                      navigation.navigate('TournamentDetail', { id: tournament.id })
                    }
                    joined={isTournamentJoined(tournament.id)}
                    showJoinBadge={key !== 'other'}
                    scopeLabel={getScopeLabel(tournament, stateLabel)}
                    currentLocation={locationLabel}
                  />
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      {showFilterModal && (
        <>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Location</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={colors.textHighlight} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>SELECT YOUR LOCATION</Text>
                <Text style={styles.modalSubtitle}>
                  Showing tournaments near your selected area
                </Text>

                <View style={styles.modalPresets}>
                  {presets.map((preset) => {
                    const isActive = preset.label === locationLabel;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.modalPresetItem,
                          isActive && styles.modalPresetItemActive,
                        ]}
                        onPress={() => {
                          setActivePresetId(preset.id);
                          setTimeout(() => setShowFilterModal(false), 200);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalPresetLeft}>
                          <Icon
                            name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
                            size={24}
                            color={isActive ? colors.accent : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.modalPresetText,
                              isActive && styles.modalPresetTextActive,
                            ]}
                          >
                            {preset.label}
                          </Text>
                        </View>
                        {isActive && (
                          <Icon name="check" size={20} color={colors.accent} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitle: {
    ...typography.heading,
  },
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(51, 183, 146, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(51, 183, 146, 0.25)',
  },
  locationPickerText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textHighlight,
    fontWeight: '600',
  },
  refreshButton: {
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  filterSortRow: {
    marginBottom: spacing.md,
  },
  sortContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
  },
  sectionEmptyText: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#7f1d1d33',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textHighlight,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.body,
    color: colors.textMuted,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 100,
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg * 1.5,
    borderTopRightRadius: radius.lg * 1.5,
    maxHeight: '70%',
    zIndex: 101,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderMuted,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.title,
    color: colors.textHighlight,
  },
  modalCloseButton: {
    padding: spacing.xs / 2,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs / 2,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalPresets: {
    gap: spacing.sm,
  },
  modalPresetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalPresetItemActive: {
    backgroundColor: colors.surfaceHighlight,
    borderColor: colors.accent,
  },
  modalPresetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  modalPresetText: {
    ...typography.body,
    color: colors.textHighlight,
    fontWeight: '600',
  },
  modalPresetTextActive: {
    color: colors.accent,
  },
});
