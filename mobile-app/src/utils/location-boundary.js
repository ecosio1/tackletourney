import { getDistanceKm } from '../mocks/tournaments';

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

const SAFETY_BUFFER_KM = 0.1;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeStateCode(stateCode) {
  return typeof stateCode === 'string' ? stateCode.trim().toUpperCase() : '';
}

function normalizeUserLocation(userLocation) {
  if (!userLocation) {
    return null;
  }

  if (typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
    return {
      lat: userLocation.lat,
      lng: userLocation.lng,
      state: normalizeStateCode(userLocation.state),
      regionName: userLocation.regionName ?? userLocation.regionLabel,
    };
  }

  if (typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
    return {
      lat: userLocation.latitude,
      lng: userLocation.longitude,
      state: normalizeStateCode(userLocation.state),
      regionName: userLocation.regionName ?? userLocation.regionLabel,
    };
  }

  return null;
}

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
  const user = normalizeUserLocation(location);

  if (!tournament || !user) {
    return { allowed: false, reason: 'LOCATION_UNKNOWN' };
  }

  const boundary = normalizeBoundary(tournament);

  if (!boundary) {
    return { allowed: false, reason: 'BOUNDARY_UNKNOWN' };
  }

  const tournamentState = normalizeStateCode(tournament.state);
  const userState = normalizeStateCode(user.state);
  const tournamentRegion = normalizeString(tournament.regionName);
  const userRegion = normalizeString(user.regionName);

  if (boundary.scopeLevel === 'STATE' || boundary.type === 'STATE') {
    const allowed = Boolean(userState && tournamentState && userState === tournamentState);
    return { allowed, reason: allowed ? null : 'OUTSIDE_STATE' };
  }

  if (boundary.scopeLevel === 'REGION' || boundary.scopeLevel === 'LOCAL') {
    const allowed = Boolean(userRegion && tournamentRegion && userRegion === tournamentRegion);
    return { allowed, reason: allowed ? null : 'OUTSIDE_REGION' };
  }

  if (boundary.scopeLevel === 'RADIUS' || boundary.type === 'RADIUS') {
    const distance = getDistanceKm(user, boundary.center);

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

  return { allowed: false, reason: 'BOUNDARY_UNKNOWN' };
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

