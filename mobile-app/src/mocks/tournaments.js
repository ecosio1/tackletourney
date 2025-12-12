
const now = Date.now();

const DEFAULT_RADIUS_BY_SCOPE = {
  STATE: 800,
  REGION: 200,
  LOCAL: 75,
};

function offsetToIso(milliseconds) {
  return new Date(now + milliseconds).toISOString();
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function getDistanceKm(pointA, pointB) {
  if (!pointA || !pointB) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusKm = 6371;
  const dLat = toRadians(pointB.lat - pointA.lat);
  const dLng = toRadians(pointB.lng - pointA.lng);

  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function normalizeStateCode(stateCode) {
  return stateCode?.toUpperCase?.() ?? stateCode ?? '';
}

const floridaCenter = { lat: 27.6648, lng: -81.5158 };

const mockLeaderboard = [
  {
    angler: 'Sarah Castillo',
    fish: 'Redfish',
    length_in: 32.4,
    weight_lb: 11.2,
    submitted_at: offsetToIso(-1000 * 60 * 42),
  },
  {
    angler: 'Mike Davenport',
    fish: 'Snook',
    length_in: 34.1,
    weight_lb: 13.5,
    submitted_at: offsetToIso(-1000 * 60 * 84),
  },
  {
    angler: 'Jamie Wu',
    fish: 'Sea Trout',
    length_in: 28.7,
    weight_lb: 7.8,
    submitted_at: offsetToIso(-1000 * 60 * 125),
  },
];

export const mockTournaments = [
  {
    id: 'tournament-swfl-slot-slam',
    state: 'FL',
    scopeLevel: 'REGION',
    regionName: 'Southwest Florida',
    geoBoundary: {
      type: 'REGION',
      name: 'Southwest Florida',
      center: { lat: 26.142036, lng: -81.79481 },
      radiusKm: 140,
    },
    name: 'SWFL Slot Slam',
    status: 'active',
    entry_fee: 20,
    prize_pool: 1200,
    participant_count: 54,
    start_time: offsetToIso(-1000 * 60 * 60 * 2),
    end_time: offsetToIso(1000 * 60 * 60 * 6),
    species: ['Redfish', 'Snook'],
    region: 'Naples, FL',
    cover_image:
      'https://images.unsplash.com/photo-1523419409543-a9d57c662d10?auto=format&fit=crop&w=1200&q=60',
    summary:
      'Target slot redfish and snook across SWFL. Location enforced at submission time—stay inside the region to log catches.',
    leaderboard: [
      {
        angler: 'Casey Morgan',
        fish: 'Redfish',
        length_in: 29.2,
        weight_lb: 8.4,
        submitted_at: offsetToIso(-1000 * 60 * 24),
      },
    ],
  },
  {
    id: 'tournament-gulf-slam',
    state: 'FL',
    scopeLevel: 'REGION',
    regionName: 'Tampa Bay',
    geoBoundary: {
      type: 'REGION',
      name: 'Tampa Bay',
      center: { lat: 27.9478, lng: -82.4586 },
      radiusKm: 160,
    },
    name: 'Gulf Coast Grand Slam',
    status: 'active',
    entry_fee: 35,
    prize_pool: 2500,
    participant_count: 87,
    start_time: offsetToIso(-1000 * 60 * 60 * 6),
    end_time: offsetToIso(1000 * 60 * 60 * 18),
    species: ['Redfish', 'Snook', 'Speckled Trout'],
    region: 'Tampa Bay, FL',
    cover_image:
      'https://images.unsplash.com/photo-1517638851339-4aa32003c11a?auto=format&fit=crop&w=1200&q=60',
    summary:
      'Catch the longest inshore slam across Tampa Bay waters. Submit all catches through the official app with verification code visible.',
    leaderboard: mockLeaderboard,
  },
  {
    id: 'tournament-lake-okeechobee',
    state: 'FL',
    scopeLevel: 'RADIUS',
    regionName: 'Lake Okeechobee',
    geoBoundary: {
      type: 'RADIUS',
      center: { lat: 26.9601, lng: -80.8334 },
      radiusKm: 65,
    },
    name: 'Lake Okeechobee Bass Classic',
    status: 'active',
    entry_fee: 25,
    prize_pool: 1800,
    participant_count: 62,
    start_time: offsetToIso(-1000 * 60 * 60 * 2),
    end_time: offsetToIso(1000 * 60 * 60 * 22),
    species: ['Largemouth Bass'],
    region: 'Lake Okeechobee, FL',
    cover_image:
      'https://images.unsplash.com/photo-1516239322100-834d6413b8be?auto=format&fit=crop&w=1200&q=60',
    summary:
      'Target trophy largemouth bass anywhere on the Big O. Big fish format with live leaderboard updates every 30 minutes.',
    leaderboard: [
      {
        angler: 'Evan Reyes',
        fish: 'Largemouth Bass',
        length_in: 25.4,
        weight_lb: 8.3,
        submitted_at: offsetToIso(-1000 * 60 * 58),
      },
    ],
  },
  {
    id: 'tournament-panhandle',
    state: 'FL',
    scopeLevel: 'REGION',
    regionName: 'Florida Panhandle',
    geoBoundary: {
      type: 'REGION',
      name: 'Florida Panhandle',
      center: { lat: 30.4207, lng: -86.617 },
      radiusKm: 220,
    },
    name: 'Panhandle Kayak Series',
    status: 'upcoming',
    entry_fee: 0,
    prize_pool: 0,
    participant_count: 43,
    start_time: offsetToIso(1000 * 60 * 60 * 24),
    end_time: offsetToIso(1000 * 60 * 60 * 48),
    species: ['Flounder', 'Redfish', 'Black Drum'],
    region: 'Pensacola, FL',
    cover_image:
      'https://images.unsplash.com/photo-1470115636492-6d2b56f9146e?auto=format&fit=crop&w=1200&q=60',
    summary:
      'Shoreline-only kayak division across the Emerald Coast. Free community event with sponsor prizes for biggest drum and best photo.',
    leaderboard: [],
  },
  {
    id: 'tournament-night-bite',
    state: 'FL',
    scopeLevel: 'STATE',
    geoBoundary: {
      type: 'STATE',
      center: floridaCenter,
      radiusKm: 600,
    },
    name: 'Midnight Surf & Turf',
    status: 'completed',
    entry_fee: 15,
    prize_pool: 750,
    participant_count: 128,
    start_time: offsetToIso(-1000 * 60 * 60 * 30),
    end_time: offsetToIso(-1000 * 60 * 60 * 6),
    species: ['Tarpon', 'Snook'],
    region: 'Fort Myers, FL',
    cover_image:
      'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=60',
    summary:
      'Overnight tarpon and snook shootout under the lights. Tournament closed with record participation and three tarpon over 150 pounds landed.',
    leaderboard: [
      {
        angler: 'Lydia Moore',
        fish: 'Tarpon',
        length_in: 74.5,
        weight_lb: 156.2,
        submitted_at: offsetToIso(-1000 * 60 * 60 * 8),
      },
    ],
  },
];

export function getMockTournaments(filters = {}) {
  const stateFilter = normalizeStateCode(filters.state);
  const scopeFilter = filters.scopeLevel;

  let tournaments = [...mockTournaments];

  if (stateFilter) {
    tournaments = tournaments.filter(
      (tournament) => normalizeStateCode(tournament.state) === stateFilter
    );
  }

  if (scopeFilter) {
    tournaments = tournaments.filter(
      (tournament) => tournament.scopeLevel === scopeFilter
    );
  }

  return { tournaments };
}

export function getMockTournamentById(id) {
  return mockTournaments.find((tournament) => tournament.id === id);
}

export function joinMockTournament(id) {
  const tournament = mockTournaments.find((item) => item.id === id);
  const joinedAt = new Date().toISOString();
  if (tournament) {
    tournament.participant_count += 1;
  }
  return {
    success: true,
    joinedAt,
    participant_count: tournament?.participant_count ?? null,
  };
}

export function getMockLeaderboard(id) {
  const tournament = mockTournaments.find((item) => item.id === id);
  return { leaderboard: tournament?.leaderboard ?? [] };
}

function inferStateFromLatLng({ lat, lng }) {
  if (lat >= 24 && lat <= 31 && lng >= -87.7 && lng <= -80) {
    return 'FL';
  }
  return undefined;
}

export function getTournamentsForState(stateCode) {
  const normalized = normalizeStateCode(stateCode);
  return {
    tournaments: mockTournaments.filter(
      (tournament) => normalizeStateCode(tournament.state) === normalized
    ),
  };
}

export function getTournamentsNearLocation(location, options = {}) {
  if (!location) {
    return { tournaments: [] };
  }

  const { stateHint, maxDistanceKm = 250 } = options;

  const inferredState = normalizeStateCode(
    stateHint ?? inferStateFromLatLng(location)
  );

  const tournaments = mockTournaments.filter((tournament) => {
    if (inferredState && normalizeStateCode(tournament.state) !== inferredState) {
      return false;
    }

    const boundary = tournament.geoBoundary ?? {};
    const center = boundary.center ?? floridaCenter;
    const allowableRadius =
      boundary.radiusKm ??
      DEFAULT_RADIUS_BY_SCOPE[tournament.scopeLevel] ??
      maxDistanceKm;
    const distance = getDistanceKm(location, center);

    if (tournament.scopeLevel === 'STATE') {
      return inferredState
        ? normalizeStateCode(tournament.state) === inferredState
        : distance <= allowableRadius;
    }

    return distance <= Math.max(allowableRadius, maxDistanceKm);
  });

  return { tournaments, state: inferredState || null };
}

export function getMockTournament(id) {
  const tournament = getMockTournamentById(id);
  return tournament ? { tournament } : { tournament: null };
}

