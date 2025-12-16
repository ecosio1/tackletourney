import React, { createContext, useContext, useMemo, useState } from 'react';

export const LOCATION_PRESETS = [
  {
    id: 'naples',
    label: 'Naples, FL',
    state: 'FL',
    regionLabel: 'Southwest Florida',
    coordinates: { lat: 26.142036, lng: -81.79481 },
  },
  {
    id: 'tampa',
    label: 'Tampa, FL',
    state: 'FL',
    regionLabel: 'Tampa Bay',
    coordinates: { lat: 27.947759, lng: -82.458444 },
  },
  {
    id: 'pensacola',
    label: 'Pensacola, FL',
    state: 'FL',
    regionLabel: 'Florida Panhandle',
    coordinates: { lat: 30.421309, lng: -87.216915 },
  },
];

const UserLocationContext = createContext(undefined);

export function UserLocationProvider({ children, defaultPresetId = 'naples' }) {
  const [activePresetId, setActivePresetId] = useState(defaultPresetId);

  const value = useMemo(() => {
    const activePreset =
      LOCATION_PRESETS.find((preset) => preset.id === activePresetId) ??
      LOCATION_PRESETS[0];

    return {
      location: activePreset.coordinates,
      locationLabel: activePreset.label,
      regionLabel: activePreset.regionLabel,
      currentState: activePreset.state,
      presets: LOCATION_PRESETS,
      activePresetId,
      setActivePresetId,
    };
  }, [activePresetId]);

  return (
    <UserLocationContext.Provider value={value}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocationContext() {
  const context = useContext(UserLocationContext);

  if (!context) {
    throw new Error(
      'useUserLocation must be used within a UserLocationProvider'
    );
  }

  return context;
}




