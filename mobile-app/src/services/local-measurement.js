function hashToPositiveInt(value) {
  const str = String(value ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Local (on-device) measurement scaffolding.
 * This is intentionally NOT real CV yet — it returns deterministic mock output
 * based on the photo URI so UI + storage plumbing can ship now.
 */
export async function analyzeCatchPhoto({ photoUri, tournamentId }) {
  const startedAt = new Date().toISOString();

  if (!photoUri) {
    return {
      status: 'error',
      version: 'local-v0',
      startedAt,
      completedAt: new Date().toISOString(),
      measuredLengthIn: null,
      confidence: 0,
      flags: ['NO_PHOTO'],
    };
  }

  const seed = hashToPositiveInt(`${photoUri}|${tournamentId ?? ''}`);

  // Simulated latency so the UI behaves like a real pipeline.
  await new Promise((resolve) => setTimeout(resolve, 350 + (seed % 400)));

  // Deterministic, plausible-ish values.
  const measured = 18 + (seed % 2600) / 100; // 18.00" - 44.00"
  const confidence = clamp(0.35 + ((seed % 60) / 100), 0, 0.95);

  const flags = [];
  if (confidence < 0.55) {
    flags.push('LOW_CONFIDENCE');
  }
  if (seed % 17 === 0) {
    flags.push('BOARD_NOT_DETECTED');
  }
  if (seed % 29 === 0) {
    flags.push('HEAD_TAIL_UNCLEAR');
  }

  return {
    status: flags.includes('LOW_CONFIDENCE') ? 'low_confidence' : 'ok',
    version: 'local-v0',
    startedAt,
    completedAt: new Date().toISOString(),
    measuredLengthIn: Number(measured.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    flags,
  };
}


