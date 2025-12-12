import { isTournamentActive } from './location-boundary';

export const TOURNAMENT_LIFECYCLE = {
  UPCOMING: 'UPCOMING',
  LIVE: 'LIVE',
  ENDING_SOON: 'ENDING_SOON',
  ENDED: 'ENDED',
  ARCHIVED: 'ARCHIVED',
};

const ENDING_SOON_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
const ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isTournamentEnded(tournament, now) {
  if (!tournament?.end_time) {
    return false;
  }

  const end = new Date(tournament.end_time);
  if (Number.isNaN(end)) {
    return false;
  }

  return now > end;
}

function getEndTimeMs(tournament) {
  if (!tournament?.end_time) {
    return null;
  }

  const endMs = new Date(tournament.end_time).getTime();
  return Number.isFinite(endMs) ? endMs : null;
}

export function getTournamentLifecycle(tournament, now = new Date()) {
  if (isTournamentActive(tournament, now)) {
    const endMs = getEndTimeMs(tournament);
    const nowMs = now.getTime();

    if (Number.isFinite(endMs) && endMs - nowMs <= ENDING_SOON_WINDOW_MS) {
      return TOURNAMENT_LIFECYCLE.ENDING_SOON;
    }

    return TOURNAMENT_LIFECYCLE.LIVE;
  }

  if (isTournamentEnded(tournament, now)) {
    const endMs = getEndTimeMs(tournament);
    const nowMs = now.getTime();

    if (Number.isFinite(endMs) && nowMs - endMs >= ARCHIVE_AFTER_MS) {
      return TOURNAMENT_LIFECYCLE.ARCHIVED;
    }

    return TOURNAMENT_LIFECYCLE.ENDED;
  }

  return TOURNAMENT_LIFECYCLE.UPCOMING;
}

export function canJoinTournament(tournament, now = new Date()) {
  const lifecycle = getTournamentLifecycle(tournament, now);
  return lifecycle !== TOURNAMENT_LIFECYCLE.ENDED && lifecycle !== TOURNAMENT_LIFECYCLE.ARCHIVED;
}

export function canSubmitCatch(tournament, now = new Date()) {
  const lifecycle = getTournamentLifecycle(tournament, now);
  return lifecycle === TOURNAMENT_LIFECYCLE.LIVE || lifecycle === TOURNAMENT_LIFECYCLE.ENDING_SOON;
}




