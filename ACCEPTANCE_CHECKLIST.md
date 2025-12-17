# TournamentCard UI Implementation - Acceptance Checklist

## ✅ 1. Primary Action Button (CTA)

### Requirements
- [x] "REG" replaced with real button component
- [x] Button label rules implemented:
  - Register (registration open)
  - View (registration closed but viewable)
  - Waitlist (tournament full)
  - Results (tournament completed)
- [x] Button styling with clear affordance (border, fill, elevation)
- [x] Minimum tap target: 44x44dp
- [x] Button placement: right-aligned in primary row

### CTA States
- [x] Default: enabled with accent color
- [x] Loading: spinner + disabled state
- [x] Disabled: dimmed with tooltip reason
- [x] Pressed: scale animation (0.98x)

### Navigation
- [x] Register button → `onRegisterPress()` for deep link
- [x] View/Results → `onPress()` to TournamentDetail

**Location**: `mobile-app/src/components/ui/TournamentCard.js:201-271, 658-816`

---

## ✅ 2. Card Title Readability

### Requirements
- [x] Gradient overlay ensures text is always readable
- [x] Title works on all image types (dark/light/busy)
- [x] Gradient: 5% → 35% → 78% opacity (top to bottom)
- [x] Title size: 24px, weight 900
- [x] Subtitle size: 13px, weight 600

**Location**: `mobile-app/src/components/ui/TournamentCard.js:634-697, 974-983`

**Test Cases**:
- [ ] Test with light background image
- [ ] Test with dark background image
- [ ] Test with busy/complex image
- [ ] Verify title never disappears

---

## ✅ 3. Live Tournament Timer

### Requirements
- [x] Shows accurate time remaining for LIVE tournaments
- [x] Updates every 60 seconds (not every second)
- [x] Format rules:
  - < 1h: "Xm remaining"
  - < 24h: "Xh Ym remaining"
  - 24h+: "Xd Xh remaining"
- [x] Emphasis when < 10 minutes (urgent state)
- [x] Timer only runs for LIVE/ENDING_SOON tournaments

**Location**: `mobile-app/src/components/ui/TournamentCard.js:84-128, 379-395`

**Test Cases**:
- [ ] Verify timer updates every 60 seconds
- [ ] Check format when < 1 hour
- [ ] Check format when < 24 hours
- [ ] Check urgent styling when < 10 minutes
- [ ] Verify timer stops for non-LIVE tournaments

---

## ✅ 4. Card Tap Zones & Navigation

### Requirements
- [x] Card body tap → Opens TournamentDetail
- [x] CTA button tap → Opens relevant flow
- [x] Stats tiles not individually tappable
- [x] Event propagation properly handled (button doesn't trigger card)

### Visual Feedback
- [x] Press state: scale 0.98x
- [x] Elevation change: 4 → 2
- [x] Shadow opacity: 0.35 → 0.15
- [x] Android ripple effect
- [x] Press highlight overlay (0 → 0.08 opacity)

**Location**: `mobile-app/src/components/ui/TournamentCard.js:331-352, 514-618, 658-816`

**Test Cases**:
- [ ] Tap card body → navigates to TournamentDetail
- [ ] Tap CTA button → correct navigation (doesn't open detail)
- [ ] Tap stats → opens TournamentDetail (not individual actions)
- [ ] Visual feedback visible on all taps
- [ ] No double-navigation issues

---

## ✅ 5. Location Duplication (Option A)

### Requirements
- [x] Screen-level location picker in header
- [x] Location shows as "Naples, FL ▾" with dropdown
- [x] Card hides location if it matches current location
- [x] Card shows location if different from current
- [x] Tapping header location opens picker modal

**Location**:
- Header: `mobile-app/src/screens/Home/HomeScreen.js:165-181`
- Card logic: `mobile-app/src/components/ui/TournamentCard.js:489-490, 704-711`

**Test Cases**:
- [ ] Set location to "Naples, FL"
- [ ] Naples tournament → location hidden
- [ ] Tampa tournament → location shown
- [ ] Tap header location → modal opens
- [ ] ProfileScreen shows all locations (no currentLocation prop)

---

## ✅ 6. Filtering & Sorting

### Chips
- [x] Horizontal scrollable row
- [x] Single-select behavior
- [x] Filters: All, Live, Registering, Today, This Week, Near Me
- [x] Instant application with animation

### Sort Dropdown
- [x] Options: Ending Soon, Starting Soon, Prize High→Low, Entry Low→High, Closest
- [x] Bottom sheet modal
- [x] Default to "Ending Soon" when Live selected

### Empty State
- [x] Title: "No tournaments found"
- [x] Clear explanation text
- [x] Two action buttons:
  - Clear Filters (primary)
  - Change Location (secondary)
- [x] Icon + helpful messaging

**Location**:
- FilterChips: `mobile-app/src/components/ui/FilterChips.js`
- SortDropdown: `mobile-app/src/components/ui/SortDropdown.js`
- EmptyState: `mobile-app/src/components/ui/FilterEmptyState.js`
- Logic: `mobile-app/src/utils/tournament-filters.js`, `mobile-app/src/utils/tournament-sorting.js`

**Test Cases**:
- [ ] Select "Live" → only live tournaments show
- [ ] Select "Today" → only today's tournaments show
- [ ] No results → empty state displays
- [ ] Tap "Clear Filters" → returns to "All" view
- [ ] Tap "Change Location" → location modal opens
- [ ] Sort by "Prize High→Low" → correct order
- [ ] Filter + Sort work together

---

## ✅ 7. Accessibility - Tap Targets

### Requirements
- [x] All tap targets ≥ 44x44dp
- [x] CTA button: minHeight 44dp
- [x] Card body: full height (exceeds 44dp)
- [x] Location picker: 44dp minimum
- [x] Filter chips: 44dp height
- [x] Sort dropdown: 44dp height

**Test Cases**:
- [ ] Measure CTA button height ≥ 44dp
- [ ] Measure filter chip height ≥ 44dp
- [ ] Measure location picker touch area
- [ ] Test with fat finger simulation

---

## ✅ 8. Accessibility - Screen Readers

### Requirements
- [x] Card label includes all essential info
- [x] Format: "Name, Status, Time, Prize, Entry, Anglers, button Action"
- [x] Status pill announced as state
- [x] Individual stats have proper labels
- [x] CTA button has action label + hint
- [x] Proper accessibility roles

### Example Output
```
"SWFL Slot Slam, LIVE, 5 hours 59 minutes remaining, Prize $1,200, Entry $20, 54 anglers, button Register"
```

**Location**: `mobile-app/src/components/ui/TournamentCard.js:502-528, 616, 649-680`

**Test Cases**:
- [ ] Enable VoiceOver (iOS) → swipe through card
- [ ] Enable TalkBack (Android) → swipe through card
- [ ] Verify complete announcement includes all info
- [ ] Status announced correctly (LIVE/UPCOMING/COMPLETED)
- [ ] Button action clearly stated

---

## ✅ 9. Accessibility - Text Contrast (WCAG AA)

### Requirements
- [x] Removed opacity overlays for better contrast
- [x] Body text contrast ≥ 4.5:1
- [x] Large text contrast ≥ 3:1
- [x] Meta text uses proper color tokens

### Contrast Ratios
- Title (textPrimary): ~16:1 ✅
- Body (textHighlight): ~10:1 ✅
- Meta (textSecondary): ~10:1 ✅
- Muted (textMuted): ~5:1 ✅

**Test Cases**:
- [ ] Run WebAIM Contrast Checker on all text
- [ ] Test in grayscale mode
- [ ] Verify readability in bright sunlight
- [ ] Test with color blindness simulators

---

## ✅ 10. Accessibility - Dynamic Type

### Requirements
- [x] Title wraps up to 2 lines (`numberOfLines={2}`)
- [x] Buttons adapt with flexShrink
- [x] Ellipsis only as last resort
- [x] Layout doesn't break at 200% scale

**Test Cases**:
- [ ] Set iOS Text Size to largest
- [ ] Set Android Font Scale to 2.0
- [ ] Verify title wraps properly
- [ ] Verify buttons don't overflow
- [ ] Check tap targets remain ≥ 44dp

---

## ✅ 11. Accessibility - Non-Color Indicators

### Requirements
- [x] Status doesn't rely on color alone
- [x] LIVE: Pulsing dot + "LIVE" text + radio icon
- [x] UPCOMING: "UPCOMING" text + schedule icon
- [x] COMPLETED: "COMPLETED" text + check-circle icon

**Location**: `mobile-app/src/components/ui/TournamentCard.js:131-175, 658-680`

**Test Cases**:
- [ ] View in grayscale mode
- [ ] Verify icons visible for all states
- [ ] Confirm text labels present
- [ ] Test with color blindness simulation

---

## ✅ 12. Visual Polish

### Typography Hierarchy
- [x] Title: 24px, weight 900 (most prominent)
- [x] CTA button: Accent color, elevated
- [x] Subtitle: 13px, weight 600
- [x] Stats: 18px values, 10px labels
- [x] Code pills: 10px, reduced opacity

### Stats Tiles
- [x] Lighter background (reduced visual weight)
- [x] Icons for each stat (trophy, payment, people)
- [x] Three equal-width tiles
- [x] Value is most prominent element
- [x] Title case labels (not UPPERCASE)

### Visual Feedback
- [x] Press animations smooth (easeInEaseOut)
- [x] Scale: 1.0 → 0.98
- [x] Elevation animates
- [x] Ripple on Android
- [x] Highlight overlay on press

**Test Cases**:
- [ ] Verify visual hierarchy clear at first glance
- [ ] Stats don't compete with title
- [ ] Press feedback feels responsive
- [ ] Animations smooth (no jank)

---

## Platform-Specific Testing

### iOS
- [ ] VoiceOver announces correctly
- [ ] Dynamic Type scales properly
- [ ] Tap targets feel right
- [ ] Animations smooth at 60fps

### Android
- [ ] TalkBack announces correctly
- [ ] Font Scale works (Settings → Accessibility)
- [ ] Ripple effects visible
- [ ] Back button navigation works

### Both Platforms
- [ ] Layout consistent
- [ ] No platform-specific bugs
- [ ] Performance good (no frame drops)

---

## Edge Cases

### Data Edge Cases
- [ ] Tournament with no prize pool → shows "Free"
- [ ] Tournament with 0 anglers → shows "0"
- [ ] Tournament with very long name → wraps to 2 lines
- [ ] No end time → handles gracefully
- [ ] Missing location → shows placeholder

### State Edge Cases
- [ ] Registration closed → button shows "View"
- [ ] Tournament full → button shows "Waitlist"
- [ ] Registration not yet open → button disabled with reason
- [ ] Loading state → shows spinner
- [ ] Already joined → button shows "View"

### Filter Edge Cases
- [ ] All filters selected → shows all
- [ ] No results → empty state
- [ ] Filter + Sort combination
- [ ] Switching filters rapidly → no crashes

---

## Performance Checklist

- [ ] Filter changes animate smoothly
- [ ] Sort changes animate smoothly
- [ ] No janky scrolling
- [ ] Images load progressively
- [ ] List virtualization working (if > 50 items)
- [ ] Timer doesn't cause re-renders of entire list

---

## Final Sign-Off

### Developer
- [ ] All acceptance criteria met
- [ ] Code reviewed
- [ ] No console warnings
- [ ] Performance profiled

### QA
- [ ] Manual testing complete
- [ ] Accessibility testing complete
- [ ] Edge cases tested
- [ ] Regression testing passed

### Design
- [ ] Visual design matches spec
- [ ] Animations feel right
- [ ] Typography hierarchy clear
- [ ] Color usage appropriate

### Product
- [ ] User flows work correctly
- [ ] Business logic correct
- [ ] Ready for production

---

## Known Limitations

1. **Distance calculation**: Uses Haversine formula (may be off by small margins)
2. **Timer precision**: Updates every 60 seconds (not real-time)
3. **Image loading**: Relies on network (may be slow on poor connection)

---

## Future Enhancements (Out of Scope)

- [ ] Favorite/bookmark tournaments
- [ ] Share tournament
- [ ] Calendar integration
- [ ] Push notifications for LIVE tournaments
- [ ] Offline mode
