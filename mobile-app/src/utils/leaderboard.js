function normalizeIso(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date)) {
    return null;
  }

  return date.toISOString();
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toLeaderboardEntryFromCatch(catchRecord) {
  // Determine if catch has verified measurement (confidence > 85%)
  const hasVerifiedMeasurement =
    catchRecord.measurement &&
    catchRecord.measurement.confidence >= 0.85 &&
    catchRecord.measurement.referenceObject?.detected;

  return {
    source: 'local',
    angler: catchRecord.userId === 'me' ? 'You' : catchRecord.userId,
    fish: catchRecord.species ?? 'Unknown',
    length_in: toNumber(catchRecord.length),
    submitted_at: normalizeIso(catchRecord.createdAt) ?? new Date().toISOString(),
    isCurrentUser: catchRecord.userId === 'me',
    status: catchRecord.status ?? 'pending',
    photoUri: catchRecord.photoUri,
    prizeEligible: catchRecord.prizeEligible !== false, // Default to true if not specified
    hasVerifiedMeasurement,
    measurementConfidence: catchRecord.measurement?.confidence,
  };
}

function toLeaderboardEntryFromMock(entry) {
  return {
    source: 'mock',
    angler: entry.angler ?? 'Unknown',
    fish: entry.fish ?? 'Unknown',
    length_in: toNumber(entry.length_in),
    submitted_at: normalizeIso(entry.submitted_at) ?? new Date().toISOString(),
    isCurrentUser: false,
    status: 'verified',
  };
}

function sortLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    const lengthDiff = toNumber(b.length_in) - toNumber(a.length_in);
    if (lengthDiff !== 0) {
      return lengthDiff;
    }

    const timeA = new Date(a.submitted_at).getTime();
    const timeB = new Date(b.submitted_at).getTime();
    return timeA - timeB;
  });
}

export function getTournamentLeaderboard({
  tournamentId,
  mockLeaderboard = [],
  catches = [],
  includePractice = false, // Whether to include non-prize-eligible catches
}) {
  const tournamentCatches = catches.filter(
    (entry) => entry?.tournamentId === tournamentId
  );

  const hasLocalCatches = tournamentCatches.length > 0;

  const mockEntries = (mockLeaderboard ?? []).map(toLeaderboardEntryFromMock);
  const localEntries = tournamentCatches.map(toLeaderboardEntryFromCatch);

  // Separate prize-eligible and practice catches
  const prizeEligibleLocal = localEntries.filter(entry => entry.prizeEligible);
  const practiceCatches = localEntries.filter(entry => !entry.prizeEligible);

  // Combine mock entries with prize-eligible local catches
  const combined = hasLocalCatches
    ? [...mockEntries, ...prizeEligibleLocal]
    : mockEntries;

  // Sort main leaderboard (prize-eligible only)
  const sorted = sortLeaderboard(combined).map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));

  const currentUserIndex = sorted.findIndex((entry) => entry.isCurrentUser);

  // Sort practice catches separately if requested
  const practiceLeaderboard = includePractice
    ? sortLeaderboard(practiceCatches).map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }))
    : [];

  return {
    entries: sorted,
    currentUserRank: currentUserIndex >= 0 ? currentUserIndex + 1 : null,
    practiceCatches: practiceLeaderboard,
    stats: {
      total: sorted.length,
      prizeEligible: prizeEligibleLocal.length,
      practice: practiceCatches.length,
      verified: sorted.filter(e => e.hasVerifiedMeasurement).length,
    },
  };
}





