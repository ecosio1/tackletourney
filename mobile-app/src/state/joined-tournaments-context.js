import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tournamentAPI } from '../services/api';

const STORAGE_KEY = '@fish_tourney_joined_tournaments_v2';

const JoinedTournamentsContext = createContext(undefined);

function ensureJoinedArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry) {
          return null;
        }

        if (typeof entry === 'string') {
          return { id: entry, joinedAt: new Date().toISOString() };
        }

        if (typeof entry === 'object' && entry.id) {
          return {
            id: entry.id,
            joinedAt:
              typeof entry.joinedAt === 'string'
                ? entry.joinedAt
                : new Date().toISOString(),
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? ensureJoinedArray(parsed) : [];
  } catch (error) {
    return [];
  }
}

export function JoinedTournamentsProvider({ children }) {
  const [joinedTournaments, setJoinedTournaments] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [joiningIds, setJoiningIds] = useState({});

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isMounted && stored) {
          setJoinedTournaments(ensureJoinedArray(stored));
        }
      } catch (error) {
        console.warn('Unable to load joined tournaments cache', error);
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

  const persistJoined = useCallback((nextJoined) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextJoined)).catch(
      (error) => {
        console.warn('Unable to persist joined tournaments', error);
      }
    );
  }, []);

  const isTournamentJoined = useCallback(
    (id) => {
      if (!id) {
        return false;
      }

      return joinedTournaments.some((entry) => entry.id === id);
    },
    [joinedTournaments]
  );

  const joinTournament = useCallback(
    async (id) => {
      if (!id) {
        return { success: false };
      }

      if (joinedTournaments.some((entry) => entry.id === id)) {
        return { success: true, alreadyJoined: true };
      }

      setJoiningIds((prev) => ({ ...prev, [id]: true }));

      try {
        const response = await tournamentAPI.joinTournament(id);
        const joinedAt =
          response?.joinedAt ?? new Date().toISOString();

        setJoinedTournaments((prev) => {
          if (prev.some((entry) => entry.id === id)) {
            return prev;
          }

          const next = [...prev, { id, joinedAt }];
          persistJoined(next);
          return next;
        });

        return response ?? { success: true };
      } catch (error) {
        console.error('Join tournament failed', error);
        throw error;
      } finally {
        setJoiningIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [joinedTournaments, persistJoined]
  );

  const value = useMemo(
    () => ({
      joinedTournaments,
      joinedTournamentIds: joinedTournaments.map((entry) => entry.id),
      isTournamentJoined,
      joinTournament,
      isJoining: (id) => Boolean(joiningIds[id]),
      isHydrated,
    }),
    [
      joinedTournaments,
      isTournamentJoined,
      joinTournament,
      joiningIds,
      isHydrated,
    ]
  );

  return (
    <JoinedTournamentsContext.Provider value={value}>
      {children}
    </JoinedTournamentsContext.Provider>
  );
}

export function useJoinedTournaments() {
  const context = useContext(JoinedTournamentsContext);

  if (!context) {
    throw new Error(
      'useJoinedTournaments must be used within JoinedTournamentsProvider'
    );
  }

  return context;
}

