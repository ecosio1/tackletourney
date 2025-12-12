import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fish_tourney_catches_v1';

const CatchesContext = createContext(undefined);

function ensureCatchArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item && item.id && item.tournamentId);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? ensureCatchArray(parsed) : [];
  } catch (error) {
    return [];
  }
}

function createCatchId() {
  return `catch_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function CatchesProvider({ children }) {
  const [catches, setCatches] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && stored) {
          setCatches(ensureCatchArray(stored));
        }
      } catch (error) {
        console.warn('Unable to load catches cache', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistCatches = useCallback((nextCatches) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextCatches)).catch(
      (error) => {
        console.warn('Unable to persist catches', error);
      }
    );
  }, []);

  const getCatchesForTournament = useCallback(
    (tournamentId) => catches.filter((entry) => entry.tournamentId === tournamentId),
    [catches]
  );

  const submitCatch = useCallback(
    (tournament, catchData) => {
      const tournamentId = tournament?.id ?? catchData?.tournamentId;

      if (!tournamentId) {
        throw new Error('Missing tournament id');
      }

      const createdAt = new Date().toISOString();

      const newCatch = {
        id: createCatchId(),
        tournamentId,
        userId: catchData?.userId ?? 'me',
        length: Number(catchData?.length) || 0,
        species: catchData?.species ?? null,
        photoUri: catchData?.photoUri ?? 'mock://photo-placeholder.jpg',
        createdAt,
        location: catchData?.location ?? null,
        locationCapturedAt:
          catchData?.locationCapturedAt ?? catchData?.gpsCapturedAt ?? createdAt,
        status: catchData?.status ?? 'pending',
        measurement: catchData?.measurement ?? null,
      };

      setCatches((prev) => {
        const next = [newCatch, ...prev];
        persistCatches(next);
        return next;
      });

      return newCatch;
    },
    [persistCatches]
  );

  const updateCatch = useCallback(
    (catchId, patch) => {
      if (!catchId) {
        return null;
      }

      let updated = null;
      setCatches((prev) => {
        const next = prev.map((entry) => {
          if (entry.id !== catchId) {
            return entry;
          }
          updated = { ...entry, ...patch };
          return updated;
        });
        persistCatches(next);
        return next;
      });

      return updated;
    },
    [persistCatches]
  );

  const value = useMemo(
    () => ({
      catches,
      isHydrated,
      getCatchesForTournament,
      submitCatch,
      updateCatch,
    }),
    [catches, isHydrated, getCatchesForTournament, submitCatch, updateCatch]
  );

  return <CatchesContext.Provider value={value}>{children}</CatchesContext.Provider>;
}

export function useCatches() {
  const context = useContext(CatchesContext);

  if (!context) {
    throw new Error('useCatches must be used within a CatchesProvider');
  }

  return context;
}


