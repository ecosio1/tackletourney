/**
 * Tournament Validation Utilities
 *
 * Provides validation logic for tournament catch submissions,
 * including measurement quality checks and prize eligibility.
 */

/**
 * Check if a catch measurement meets minimum quality requirements
 */
export function isValidMeasurement(measurement) {
  if (!measurement) {
    return {
      valid: false,
      reason: 'NO_MEASUREMENT',
      message: 'No measurement data available',
    };
  }

  // Check if measurement has required fields
  if (!measurement.status || !measurement.version) {
    return {
      valid: false,
      reason: 'INVALID_FORMAT',
      message: 'Measurement data is incomplete',
    };
  }

  // Error status is not valid
  if (measurement.status === 'error') {
    return {
      valid: false,
      reason: 'MEASUREMENT_ERROR',
      message: 'Measurement failed',
    };
  }

  // Idle status means no measurement was attempted
  if (measurement.status === 'idle') {
    return {
      valid: false,
      reason: 'NOT_MEASURED',
      message: 'Photo was not analyzed',
    };
  }

  // Valid statuses: 'ok' or 'low_confidence'
  return {
    valid: true,
    reason: null,
    message: null,
  };
}

/**
 * Check if a catch can be submitted for prize eligibility
 * More stringent requirements than basic validity
 */
export function canSubmitForPrizes(catchData, tournament) {
  // Check if tournament has prizes
  if (!tournament || !tournament.prize_pool || tournament.prize_pool <= 0) {
    // No prize pool, so prize eligibility doesn't matter
    return {
      eligible: true,
      reason: null,
      message: null,
    };
  }

  // Check measurement exists
  if (!catchData.measurement) {
    return {
      eligible: false,
      reason: 'NO_MEASUREMENT',
      message: 'Measurement required for prize-eligible submissions',
    };
  }

  const { measurement } = catchData;

  // Check measurement validity first
  const validCheck = isValidMeasurement(measurement);
  if (!validCheck.valid) {
    return {
      eligible: false,
      reason: validCheck.reason,
      message: validCheck.message,
    };
  }

  // Check confidence threshold (70% minimum for prizes)
  const PRIZE_CONFIDENCE_THRESHOLD = 0.70;
  if (!measurement.confidence || measurement.confidence < PRIZE_CONFIDENCE_THRESHOLD) {
    return {
      eligible: false,
      reason: 'LOW_CONFIDENCE',
      message: `Confidence ${((measurement.confidence || 0) * 100).toFixed(0)}% is below ${(PRIZE_CONFIDENCE_THRESHOLD * 100)}% threshold`,
    };
  }

  // Check reference object detected
  if (!measurement.referenceObject || !measurement.referenceObject.detected) {
    return {
      eligible: false,
      reason: 'NO_REFERENCE_FOUND',
      message: 'ArUco marker must be visible for prize-eligible catches',
    };
  }

  // Check for critical flags that disqualify from prizes
  const CRITICAL_FLAGS = [
    'NO_REFERENCE_FOUND',
    'MEASUREMENT_ERROR',
    'FISH_NOT_DETECTED',
  ];

  if (measurement.flags && Array.isArray(measurement.flags)) {
    const hasCriticalFlag = measurement.flags.some(flag =>
      CRITICAL_FLAGS.includes(flag)
    );

    if (hasCriticalFlag) {
      return {
        eligible: false,
        reason: 'CRITICAL_FLAG',
        message: 'Measurement quality issues detected',
      };
    }
  }

  // All checks passed
  return {
    eligible: true,
    reason: null,
    message: null,
  };
}

/**
 * Get a user-friendly message for prize eligibility status
 */
export function getPrizeEligibilityMessage(catchData, tournament) {
  const result = canSubmitForPrizes(catchData, tournament);

  if (result.eligible) {
    return {
      variant: 'success',
      icon: 'verified',
      message: 'Eligible for tournament prizes',
    };
  }

  // Not eligible - provide specific guidance
  switch (result.reason) {
    case 'NO_MEASUREMENT':
      return {
        variant: 'warning',
        icon: 'info',
        message: 'Photo not analyzed - may not be eligible for prizes',
      };

    case 'LOW_CONFIDENCE':
      return {
        variant: 'warning',
        icon: 'warning',
        message: 'Low measurement confidence - not eligible for prizes',
      };

    case 'NO_REFERENCE_FOUND':
      return {
        variant: 'danger',
        icon: 'error',
        message: 'ArUco marker required for prize eligibility',
      };

    case 'MEASUREMENT_ERROR':
      return {
        variant: 'danger',
        icon: 'error',
        message: 'Measurement failed - not eligible for prizes',
      };

    default:
      return {
        variant: 'warning',
        icon: 'info',
        message: result.message || 'May not be eligible for prizes',
      };
  }
}

/**
 * Calculate measurement quality score (0-100)
 */
export function getMeasurementQualityScore(measurement) {
  if (!measurement || measurement.status === 'error' || measurement.status === 'idle') {
    return 0;
  }

  let score = 0;

  // Base score from confidence (0-70 points)
  score += (measurement.confidence || 0) * 70;

  // Bonus for reference object detected (0-15 points)
  if (measurement.referenceObject?.detected) {
    score += (measurement.referenceObject.confidence || 0) * 15;
  }

  // Bonus for OK status (0-15 points)
  if (measurement.status === 'ok') {
    score += 15;
  } else if (measurement.status === 'low_confidence') {
    score += 7.5; // Half bonus
  }

  // Penalties for flags
  const flagPenalties = {
    'LOW_CONFIDENCE': -10,
    'MARKER_UNCLEAR': -5,
    'HEAD_TAIL_UNCLEAR': -5,
    'MULTIPLE_FISH': -10,
  };

  if (measurement.flags && Array.isArray(measurement.flags)) {
    measurement.flags.forEach(flag => {
      if (flagPenalties[flag]) {
        score += flagPenalties[flag];
      }
    });
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get quality tier (A/B/C/D/F) for display
 */
export function getMeasurementQualityTier(measurement) {
  const score = getMeasurementQualityScore(measurement);

  if (score >= 90) return { tier: 'A', label: 'Excellent', color: '#22c55e' };
  if (score >= 80) return { tier: 'B', label: 'Good', color: '#84cc16' };
  if (score >= 70) return { tier: 'C', label: 'Fair', color: '#eab308' };
  if (score >= 60) return { tier: 'D', label: 'Poor', color: '#f97316' };
  return { tier: 'F', label: 'Failed', color: '#ef4444' };
}

/**
 * Check if catch should be flagged for manual review
 */
export function requiresManualReview(catchData, tournament) {
  // Always review top 10 placements in prize tournaments
  if (tournament?.prize_pool > 0) {
    // Would need leaderboard position here
    // For now, flag based on measurement quality
  }

  const { measurement } = catchData;

  if (!measurement) {
    return {
      review: false,
      reason: null,
    };
  }

  // Flag if confidence is borderline (70-85%)
  if (measurement.confidence >= 0.70 && measurement.confidence < 0.85) {
    return {
      review: true,
      reason: 'BORDERLINE_CONFIDENCE',
      message: 'Confidence is above minimum but borderline',
    };
  }

  // Flag if multiple fish detected
  if (measurement.flags?.includes('MULTIPLE_FISH')) {
    return {
      review: true,
      reason: 'MULTIPLE_FISH',
      message: 'Multiple fish detected in photo',
    };
  }

  // Flag if marker was unclear
  if (measurement.flags?.includes('MARKER_UNCLEAR')) {
    return {
      review: true,
      reason: 'MARKER_UNCLEAR',
      message: 'Reference marker partially obscured or unclear',
    };
  }

  // No manual review needed
  return {
    review: false,
    reason: null,
  };
}
