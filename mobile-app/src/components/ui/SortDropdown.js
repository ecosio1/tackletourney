import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../styles/tokens';

export const SORT_OPTIONS = [
  { id: 'endingSoon', label: 'Ending Soon' },
  { id: 'startingSoon', label: 'Starting Soon' },
  { id: 'prizeHighToLow', label: 'Prize High → Low' },
  { id: 'entryLowToHigh', label: 'Entry Low → High' },
  { id: 'closest', label: 'Closest' },
];

export default function SortDropdown({ selectedSort = 'endingSoon', onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.id === selectedSort);

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerLabel}>Sort:</Text>
        <Text style={styles.triggerValue}>{selectedOption?.label ?? 'Ending Soon'}</Text>
        <Icon name="expand-more" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Tournaments</Text>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.modalCloseButton}>
              <Icon name="close" size={24} color={colors.textHighlight} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalBody}>
              {SORT_OPTIONS.map((option) => {
                const isSelected = option.id === selectedSort;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.sortOption, isSelected && styles.sortOptionActive]}
                    onPress={() => {
                      onSortChange(option.id);
                      setTimeout(() => setIsOpen(false), 200);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sortOptionLeft}>
                      <Icon
                        name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={24}
                        color={isSelected ? colors.accent : colors.textMuted}
                      />
                      <Text style={[styles.sortOptionText, isSelected && styles.sortOptionTextActive]}>
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && <Icon name="check" size={20} color={colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
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
  triggerLabel: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  triggerValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textHighlight,
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
    maxHeight: '60%',
    zIndex: 101,
  },
  modalScrollView: {
    maxHeight: 350,
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
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  sortOption: {
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
  sortOptionActive: {
    backgroundColor: colors.surfaceHighlight,
    borderColor: colors.accent,
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  sortOptionText: {
    ...typography.body,
    color: colors.textHighlight,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: colors.accent,
  },
});
