/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Sort tournaments by the given sort option
 */
export function sortTournaments(tournaments, sortId, userLocation = null) {
  if (!tournaments || tournaments.length === 0) {
    return tournaments;
  }

  const sorted = [...tournaments];

  switch (sortId) {
    case 'endingSoon': {
      // Sort by end time, soonest first
      return sorted.sort((a, b) => {
        const aEnd = a.end_time ? new Date(a.end_time).getTime() : Infinity;
        const bEnd = b.end_time ? new Date(b.end_time).getTime() : Infinity;
        return aEnd - bEnd;
      });
    }

    case 'startingSoon': {
      // Sort by start time, soonest first
      return sorted.sort((a, b) => {
        const aStart = a.start_time ? new Date(a.start_time).getTime() : Infinity;
        const bStart = b.start_time ? new Date(b.start_time).getTime() : Infinity;
        return aStart - bStart;
      });
    }

    case 'prizeHighToLow': {
      // Sort by prize pool, highest first
      return sorted.sort((a, b) => {
        const aPrize = Number.parseFloat(a.prize_pool ?? 0);
        const bPrize = Number.parseFloat(b.prize_pool ?? 0);
        return bPrize - aPrize; // Descending
      });
    }

    case 'entryLowToHigh': {
      // Sort by entry fee, lowest first
      return sorted.sort((a, b) => {
        const aEntry = Number.parseFloat(a.entry_fee ?? 0);
        const bEntry = Number.parseFloat(b.entry_fee ?? 0);
        return aEntry - bEntry; // Ascending
      });
    }

    case 'closest': {
      // Sort by distance from user location
      if (!userLocation || !userLocation.lat || !userLocation.lng) {
        // If no user location, can't sort by distance
        return sorted;
      }

      return sorted.sort((a, b) => {
        const aLat = a.centerLat ?? a.lat;
        const aLng = a.centerLng ?? a.lng;
        const bLat = b.centerLat ?? b.lat;
        const bLng = b.centerLng ?? b.lng;

        const aDist = calculateDistance(userLocation.lat, userLocation.lng, aLat, aLng);
        const bDist = calculateDistance(userLocation.lat, userLocation.lng, bLat, bLng);

        return aDist - bDist; // Ascending (closest first)
      });
    }

    default:
      return sorted;
  }
}
