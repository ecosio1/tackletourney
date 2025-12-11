export function isTournamentActive(tournament, now = new Date()) {
  if (!tournament?.start_time || !tournament?.end_time) {
    return false;
  }

  const start = new Date(tournament.start_time);
  const end = new Date(tournament.end_time);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return now >= start && now <= end;
}
import { getDistanceKm } from '../mocks/tournaments';

const SAFETY_BUFFER_KM = 0.1;

function normalizeBoundary(tournament) {
  if (!tournament) {
    return null;
  }

  const boundary = tournament.geoBoundary ?? {};
  const scopeLevel = tournament.scopeLevel ?? boundary.type;

  return {
    type: boundary.type ?? scopeLevel ?? 'STATE',
    scopeLevel: scopeLevel ?? 'STATE',
    center: boundary.center,
    radiusKm: boundary.radiusKm,
    state: tournament.state,
  };
}

export function checkLocationAllowedForTournament(tournament, location) {
  if (!tournament || !location) {
    return { allowed: false, reason: 'LOCATION_UNKNOWN' };
  }

  const boundary = normalizeBoundary(tournament);

  if (!boundary) {
    return { allowed: false, reason: 'BOUNDARY_UNKNOWN' };
  }

  if (boundary.scopeLevel === 'STATE' || boundary.type === 'STATE') {
    return {
      allowed: Boolean(boundary.state),
      reason: boundary.state ? null : 'BOUNDARY_UNKNOWN',
    };
  }

  const distance = getDistanceKm(location, boundary.center);

  if (!Number.isFinite(distance)) {
    return { allowed: false, reason: 'LOCATION_UNKNOWN' };
  }

  const permittedRadius =
    Number(boundary.radiusKm) > 0 ? boundary.radiusKm + SAFETY_BUFFER_KM : 200;

  if (distance <= permittedRadius) {
    return { allowed: true, reason: null };
  }

  return {
    allowed: false,
    reason: 'OUTSIDE_BOUNDARY',
    distanceKm: distance,
    permittedRadiusKm: permittedRadius,
  };
}

export function describeBoundary(tournament) {
  if (!tournament) {
    return '';
  }

  const boundary = normalizeBoundary(tournament);

  if (boundary.scopeLevel === 'STATE') {
    return `Statewide anywhere in ${tournament.state}.`;
  }

  if (boundary.scopeLevel === 'REGION') {
    return `Within the ${tournament.regionName ?? 'region'} of ${
      tournament.state
    }.`;
  }

  if (boundary.scopeLevel === 'LOCAL') {
    return `Local boundary: ${tournament.regionName ?? 'local area'}.`;
  }

  if (boundary.scopeLevel === 'RADIUS') {
    const miles =
      typeof boundary.radiusKm === 'number'
        ? Math.round(boundary.radiusKm * 0.621371)
        : null;
    const centerLabel =
      tournament.regionName ?? tournament.geoBoundary?.name ?? 'the pin';

    if (miles) {
      return `Within ${miles} miles of ${centerLabel}.`;
    }

    return `Within the defined radius for ${centerLabel}.`;
  }

  return 'Boundary defined for this tournament.';
}

