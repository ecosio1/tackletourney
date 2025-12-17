import { getTournamentLifecycle, TOURNAMENT_LIFECYCLE, canJoinTournament } from './tournament-lifecycle';

/**
 * Check if a tournament matches the given filter
 */
export function matchesFilter(tournament, filterId, userLocation = null) {
  const now = new Date();
  const lifecycle = getTournamentLifecycle(tournament, now);

  switch (filterId) {
    case 'live':
      return lifecycle === TOURNAMENT_LIFECYCLE.LIVE || lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON;

    case 'registering': {
      // Tournaments that are currently accepting registrations
      const canJoin = canJoinTournament(tournament, now);

      // Check if registration is open (not closed and not in the past)
      const registrationOpen = !tournament.registration_closed &&
        (!tournament.registration_end_time || new Date(tournament.registration_end_time) > now);

      return canJoin && registrationOpen;
    }

    case 'today': {
      if (!tournament.start_time) return false;
      const startDate = new Date(tournament.start_time);
      const today = new Date();
      return startDate.toDateString() === today.toDateString();
    }

    case 'thisWeek': {
      if (!tournament.start_time) return false;
      const startDate = new Date(tournament.start_time);
      const today = new Date();
      const weekFromNow = new Date(today);
      weekFromNow.setDate(today.getDate() + 7);
      return startDate >= today && startDate <= weekFromNow;
    }

    case 'nearMe': {
      // This requires location data to be effective
      // For now, we'll consider tournaments with RADIUS or LOCAL scope as "near me"
      if (!tournament.scopeLevel) return false;
      return tournament.scopeLevel === 'RADIUS' || tournament.scopeLevel === 'LOCAL';
    }

    default:
      return true;
  }
}

/**
 * Apply a single filter to a tournament list
 */
export function applyFilter(tournaments, selectedFilter, userLocation = null) {
  // 'all' filter or no filter shows everything
  if (!selectedFilter || selectedFilter === 'all') {
    return tournaments;
  }

  return tournaments.filter((tournament) => {
    return matchesFilter(tournament, selectedFilter, userLocation);
  });
}
