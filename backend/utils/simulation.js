/**
 * Pk = detection * tracking * intercept
 * detection = tracking_accuracy * (1 - stealth_score)
 * tracking = tracking_accuracy
 * intercept = effectiveness (0–1)
 */

function stealthScoreFromDrone(drone) {
  const level = drone?.specs?.stealth_level || 'Low';
  if (level === 'High') return 0.85;
  if (level === 'Medium') return 0.5;
  return 0.2;
}

function trackingAccuracyFromCounter(counter) {
  const t = counter?.tracking_type || 'Semi-auto';
  const map = {
    Manual: 0.55,
    'Semi-auto': 0.72,
    'Fully-auto': 0.86,
    'AI-guided': 0.94,
  };
  return map[t] ?? 0.72;
}

function effectivenessToIntercept(effectiveness) {
  if (effectiveness === 'High') return 0.9;
  if (effectiveness === 'Medium') return 0.6;
  if (effectiveness === 'Low') return 0.35;
  return 0.5;
}

function computePk(drone, counter) {
  return computePkContextual(drone, counter, null);
}

/**
 * @param {object|null} context from detectQueryContext: { night, stealthFocus, swarm }
 */
function computePkContextual(drone, counter, context) {
  const tracking_accuracy = trackingAccuracyFromCounter(counter);
  const stealth_score = stealthScoreFromDrone(drone);
  const intercept = effectivenessToIntercept(counter.effectiveness);

  let detection = tracking_accuracy * (1 - stealth_score);

  if (context?.night) {
    const st = counter?.sensor_type || '';
    if (st === 'Radar') detection *= 0.88;
    else if (st === 'IR' || st === 'Optical' || st === 'Multi-sensor') detection *= 1.08;
    else if (st === 'EW') detection *= 1.04;
  }

  if (context?.stealthFocus) {
    detection *= 0.9;
  }

  const tracking = tracking_accuracy;
  let pk = detection * tracking * intercept;

  if (context?.swarm) {
    pk *= swarmEngagementScale(drone, counter);
  }

  return Math.max(0, Math.min(1, pk));
}

function swarmEngagementScale(drone, counter) {
  const st = Number(counter?.simultaneous_targets) || 1;
  const isSwarmDrone = drone?.type === 'Swarm';

  if (isSwarmDrone) {
    if (st >= 4) return 1.06;
    if (st >= 2) return 0.94;
    if (counter?.type === 'Jamming') return 0.98;
    return 0.84;
  }

  if (st >= 4) return 1.02;
  if (st < 2) return 0.93;
  return 1;
}

/**
 * Second-layer engagement: best counter vs this drone (max Pk), optional query context.
 */
function bestEngagementForDrone(drone, counters, context = null) {
  if (!drone || !counters?.length) {
    return { bestPk: 0, bestCounter: null };
  }
  let bestPk = -1;
  let bestCounter = null;
  for (const counter of counters) {
    const pk = computePkContextual(drone, counter, context);
    if (pk > bestPk) {
      bestPk = pk;
      bestCounter = counter;
    }
  }
  return { bestPk: Math.max(0, bestPk), bestCounter };
}

module.exports = {
  computePk,
  computePkContextual,
  bestEngagementForDrone,
  stealthScoreFromDrone,
  trackingAccuracyFromCounter,
  effectivenessToIntercept,
};
