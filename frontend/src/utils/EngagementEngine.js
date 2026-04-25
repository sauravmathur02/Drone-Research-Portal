/**
 * Adaptive EngagementEngine v2.0
 * Physics-Bounded Logistic Adaptation Model
 * 
 * Key improvements over v1:
 * - Pk has a CEILING based on physical spec mismatches (never converges to 100%)
 * - IQ is DERIVED from counter-system attributes, not hardcoded
 * - Diminishing returns via inverse-time scaling
 * - Gaussian noise replaces uniform jitter
 * - Factor-decomposed Pk for transparency
 */

const EFFECTIVENESS_SCORES = { High: 45, Medium: 30, Low: 15 };
const STEALTH_WEIGHTS = { High: 0.8, Medium: 0.5, Low: 0.2 };
const JAMMING_WEIGHTS = { High: 0.7, Medium: 0.4, Low: 0.1 };

/**
 * Environmental Degradation Matrix
 * Multipliers applied to specific phases based on Weather.
 */
const WEATHER_MATRIX = {
  'Clear':     { detection: 1.1, tracking: 1.1, lock: 1.1, engagement: 1.0 },
  'Fog':       { detection: 0.4, tracking: 0.8, lock: 0.9, engagement: 0.9 },
  'Rain':      { detection: 0.8, tracking: 0.5, lock: 0.7, engagement: 0.8 },
  'Night':     { detection: 0.7, tracking: 0.9, lock: 0.4, engagement: 0.9 },
  'Sandstorm': { detection: 0.3, tracking: 0.4, lock: 0.5, engagement: 0.6 }
};

/**
 * Scenario Effect Matrix
 * Modifies tracking stability, engagement success, and enemy behavior.
 */
const SCENARIO_MATRIX = {
  'Border Surveillance': { detection: 1.2, tracking: 1.0, lock: 1.0, engagement: 1.0, overload: 1.0, evasion: 0.8 },
  'Urban Combat':        { detection: 0.6, tracking: 0.5, lock: 0.7, engagement: 0.8, overload: 1.2, evasion: 1.5 },
  'Swarm Attack':        { detection: 1.0, tracking: 0.8, lock: 0.6, engagement: 0.5, overload: 0.4, evasion: 1.2 },
  'High Altitude Recon': { detection: 0.7, tracking: 0.9, lock: 0.8, engagement: 0.7, overload: 1.0, evasion: 0.5 }
};

/**
 * Sensor lookup tables for IQ derivation
 */
const SENSOR_SCORES  = { 'Radar': 0.4, 'IR': 0.35, 'EW': 0.5, 'Optical': 0.25, 'Multi-sensor': 0.6 };
const TRACK_SCORES   = { 'Manual': 0.1, 'Semi-auto': 0.3, 'Fully-auto': 0.5, 'AI-guided': 0.7 };
const FC_SCORES      = { 'Basic': 0.2, 'Advanced': 0.5, 'Networked': 0.7 };

/**
 * Derive System IQ from real counter-system attributes.
 * Returns a value 0.10 – 0.85.
 */
export const computeSystemIQ = (counter) => {
  const S = SENSOR_SCORES[counter.sensor_type]  || 0.3;
  const T = TRACK_SCORES[counter.tracking_type]  || 0.3;
  const F = FC_SCORES[counter.fire_control]      || 0.3;

  // Reaction time: faster = smarter (2s → 1.0, 30s → 0.07)
  const rt = Number(counter.reaction_time_sec) || 10;
  const R = Math.max(0.07, 1 - (rt - 2) / 30);

  // Multi-target capability: +0.05 per target above 1, capped at +0.15
  const mt = Number(counter.simultaneous_targets) || 1;
  const M = Math.min(0.15, (mt - 1) * 0.05);

  const iq = Math.min(0.85, (S * 0.30 + T * 0.30 + F * 0.25 + R * 0.15) + M);
  return Math.round(iq * 100) / 100; // 2 decimal places
};

/**
 * Compute the physics ceiling for this engagement.
 * This is the MAXIMUM Pk this counter can ever achieve against this drone,
 * regardless of how many salvos are fired.
 */
export const computePkCeiling = (drone, counter, weather = 'Clear') => {
  const effectiveness = counter.effectiveness || 'Medium';
  const maxBase = EFFECTIVENESS_SCORES[effectiveness] || 30;

  // Stealth penalty: High stealth permanently caps Pk
  const stealthLabel = drone.specs?.stealth_level || 'Low';
  const stealthPenalty = STEALTH_WEIGHTS[stealthLabel] || 0.2;

  // Speed penalty: faster drones reduce tracking ceiling
  const speed = drone.specs?.speed_kmh || 200;
  const speedPenalty = speed > 800 ? 0.20 : speed > 400 ? 0.10 : 0.0;

  // Range mismatch penalty: if drone outranges counter, ceiling drops
  const droneRange = drone.specs?.weapon_range_km || drone.specs?.range_km || 50;
  const counterRange = counter.range_km || 5;
  const rangePenalty = droneRange > counterRange * 3 ? 0.15 : 0.0;

  // Weather impact
  const typeKey = getSystemTypeKey(counter.type);
  const weatherMap = WEATHER_MATRIX[weather] || WEATHER_MATRIX['Clear'];
  const envMultiplier = Number(weatherMap[typeKey] || 1.0);

  // Ceiling formula: base effectiveness reduced by permanent penalties
  const ceiling = maxBase * (1 - stealthPenalty * 0.4) * (1 - speedPenalty) * (1 - rangePenalty) * envMultiplier;

  // Clamp between 15% and 95%
  return Math.round(Math.max(15, Math.min(95, ceiling * 2.2)));
};

/**
 * Normalizes system type to keys used in matrices.
 */
const getSystemTypeKey = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('laser')) return 'Laser';
  if (t.includes('jamming') || t.includes('electronic')) return 'EW';
  if (t.includes('missile')) return 'Radar';
  if (t.includes('interceptor')) return 'Kinetic';
  if (t.includes('gun') || t.includes('kinetic')) return 'Kinetic';
  return 'Radar';
};

/**
 * Box-Muller Gaussian random number generator.
 * Returns a value with mean=0, stddev=1.
 */
const gaussianRandom = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

/**
 * Calculate initial base Pk as a percentage.
 */
export const calculateBasePk = (drone, counter, weather = 'Clear') => {
  const effectiveness = counter.effectiveness || 'Medium';
  const basePk = EFFECTIVENESS_SCORES[effectiveness] || 30;

  const stealthLabel = drone.specs?.stealth_level || 'Low';
  const sFactor = STEALTH_WEIGHTS[stealthLabel] || 0.2;

  const jamLabel = drone.specs?.jamming_resistance || 'Low';
  const jFactor = JAMMING_WEIGHTS[jamLabel] || 0.1;

  let pk = basePk * (1 - (sFactor * 0.5)) * (1 - jFactor);

  const typeKey = getSystemTypeKey(counter.type);
  const weatherMap = WEATHER_MATRIX[weather] || WEATHER_MATRIX['Clear'];
  const envMultiplier = Number(weatherMap[typeKey] || 1.0);

  const result = Math.round(Number(pk) * envMultiplier);
  return isNaN(result) ? 20 : result;
};

const calculateDistance = (p1, p2) => {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

const lerpPos = (p1, p2, t, evasionActive = false, evasionMagnitude = 0, frameIdx = 0) => {
  // Add speed variation (surge and slow)
  const speedVar = evasionActive ? Math.sin(frameIdx * 0.1) * 0.2 + 1 : 1;
  const effectiveT = Math.min(1, t * speedVar);

  const baseLat = p1.lat + (p2.lat - p1.lat) * effectiveT;
  const baseLng = p1.lng + (p2.lng - p1.lng) * effectiveT;
  
  if (!evasionActive || evasionMagnitude <= 0) {
    return { lat: baseLat, lng: baseLng, isEvasive: false };
  }

  // Complex evasive wobble (combines high frequency jitter and low frequency sweeping)
  const angle = Math.atan2(p2.lat - p1.lat, p2.lng - p1.lng);
  const perpAngle = angle + Math.PI / 2;
  const sweep = Math.sin(frameIdx * 0.05) * (evasionMagnitude * 0.01);
  const jitter = Math.cos(frameIdx * 0.3) * (evasionMagnitude * 0.003);
  
  return {
    lat: baseLat + Math.sin(perpAngle) * (sweep + jitter),
    lng: baseLng + Math.cos(perpAngle) * (sweep + jitter),
    isEvasive: true
  };
};

/**
 * Generate an Adaptive AI Engagement Simulation (v2.0).
 * 
 * Changes from v1:
 * - Pk bounded by computePkCeiling() — never converges to 100%
 * - IQ derived from counter attributes via computeSystemIQ()
 * - Diminishing returns: gain(t) = base_gain / (1 + 0.3*t)
 * - Gaussian sensor noise instead of uniform jitter
 */
export const generateEngagementSimulation = (drone, counter, origin, target, counterPos, weather = 'Clear', scenario = 'Border Surveillance', targetCount = 1) => {
  if (!drone || !counter) return null;

  const events = [];
  const frames = [];
  const totalFrames = 300;
  const reloadFrames = 40;

  const detRange = drone.specs?.detection_range_km || 10;
  const wepRange = counter.range_km || 5;
  const stealthFactor = drone.specs?.stealth_level === 'High' ? 0.3 : drone.specs?.stealth_level === 'Medium' ? 0.6 : 1.0;
  const effectiveDetRange = detRange * stealthFactor;

  const envMods = WEATHER_MATRIX[weather] || WEATHER_MATRIX['Clear'];
  const scenMods = SCENARIO_MATRIX[scenario] || SCENARIO_MATRIX['Border Surveillance'];
  
  // IQ derived from attributes (not hardcoded)
  const systemIqValue = computeSystemIQ(counter);

  // Multi-target Overload Penalty
  // The higher the target count, the harder the system struggles to maintain lock and track.
  // Mitigated slightly by the system's IQ and the scenario's overload modifier.
  const overloadPenalty = targetCount > 1 
    ? Math.max(0.1, 1 - ((targetCount - 1) * 0.2 * (1 / systemIqValue) * scenMods.overload))
    : 1.0;

  let currentPhase = 'INBOUND'; // INBOUND -> DETECTION -> TRACKING -> LOCK -> ENGAGEMENT -> RESULT
  let phaseProgress = 0; // 0 to 100%
  let nextPhaseThreshold = 100;
  
  // Base Probabilities per phase (Modified by Weather, Scenario, and Overload)
  let probDetection = Math.min(95, (detRange / (drone.specs?.stealth_level === 'High' ? 1.5 : 1)) * 10 * envMods.detection * scenMods.detection * overloadPenalty);
  let probTracking = Math.min(95, (systemIqValue * 100) * envMods.tracking * scenMods.tracking * (drone.specs?.speed_kmh > 400 ? 0.7 : 1) * overloadPenalty);
  let probLock = Math.min(95, (systemIqValue * 100) * envMods.lock * scenMods.lock * (drone.specs?.jamming_resistance === 'High' ? 0.5 : 1) * overloadPenalty);

  let detectedAt = -1;
  let trackedAt = -1;
  let lockedAt = -1;
  let neutralizedAt = -1;
  let lastShotFrame = -999;
  let shotsFired = 0;
  let framesInPhase = 0;

  // Physics-bounded adaptive state
  const basePk = calculateBasePk(drone, counter, weather);
  const pkCeiling = computePkCeiling(drone, counter, weather);
  let adaptivePk = basePk;

  // Stealth adds "noise" to the learning loop
  const stealthLabel = drone.specs?.stealth_level || 'Low';
  const learningEfficiency = Number(1 - (STEALTH_WEIGHTS[stealthLabel] || 0.2));

  console.log(`[SimEngine v4] Init: Scenario=${scenario}, Targets=${targetCount}, BasePk=${basePk}, Ceiling=${pkCeiling}, IQ=${systemIqValue}, Weather=${weather}`);
  events.push({ frame: 0, type: 'INBOUND', msg: `Target inbound. Scenario: ${scenario}. Env: ${weather}. System armed.` });

  for (let i = 0; i <= totalFrames; i++) {
    const t = i / totalFrames;
    const isEvasive = currentPhase === 'TRACKING' || currentPhase === 'LOCK' || currentPhase === 'ENGAGEMENT';
    const evasionMagnitude = isEvasive ? (drone.specs?.speed_kmh > 400 ? 2.5 : 1.0) * scenMods.evasion : 0;
    
    const currentPosInfo = lerpPos(origin, target, t, isEvasive, evasionMagnitude, i);
    const currentPos = { lat: currentPosInfo.lat, lng: currentPosInfo.lng };
    const distToCounter = calculateDistance(currentPos, counterPos);

    framesInPhase++;

    // Adaptive Phase Strategy: If stuck in a phase for too long, AI attempts to adjust
    if (framesInPhase > 60 && currentPhase !== 'RESULT' && currentPhase !== 'ENGAGEMENT') {
      if (currentPhase === 'TRACKING') {
        probTracking = Math.min(95, probTracking + 10);
        events.push({ frame: i, type: 'TRACKING', msg: 'AI Adaptation: Boosting radar gain. Tracking stability +10%.' });
      } else if (currentPhase === 'LOCK') {
        probLock = Math.min(95, probLock + 15);
        events.push({ frame: i, type: 'LOCK', msg: 'AI Adaptation: Narrowing EM beam. Lock probability +15%.' });
      }
      framesInPhase = 0;
    }

    // Phase Transitions
    if (currentPhase === 'INBOUND' && distToCounter <= effectiveDetRange) {
      phaseProgress += (probDetection / 100) * 5;
      if (phaseProgress >= nextPhaseThreshold || distToCounter < effectiveDetRange * 0.5) {
        currentPhase = 'DETECTION';
        detectedAt = i;
        phaseProgress = 0;
        framesInPhase = 0;
        events.push({ frame: i, type: 'DETECTION', msg: `Target detected at ${distToCounter.toFixed(1)}km. Prob: ${Math.round(probDetection)}%` });
      }
    } 
    else if (currentPhase === 'DETECTION') {
      phaseProgress += (probTracking / 100) * 4;
      if (phaseProgress >= nextPhaseThreshold) {
        currentPhase = 'TRACKING';
        trackedAt = i;
        phaseProgress = 0;
        framesInPhase = 0;
        events.push({ frame: i, type: 'TRACKING', msg: `Target track established. Evasion maneuvers detected. Prob: ${Math.round(probTracking)}%` });
      }
    }
    else if (currentPhase === 'TRACKING') {
      phaseProgress += (probLock / 100) * 3;
      if (phaseProgress >= nextPhaseThreshold) {
        currentPhase = 'LOCK';
        lockedAt = i;
        phaseProgress = 0;
        framesInPhase = 0;
        events.push({ frame: i, type: 'LOCK', msg: `Weapons lock secured. Ready to engage. Prob: ${Math.round(probLock)}%` });
      }
    }
    else if (currentPhase === 'LOCK' || currentPhase === 'ENGAGEMENT') {
      if (distToCounter <= wepRange && i - lastShotFrame >= reloadFrames) {
        currentPhase = 'ENGAGEMENT';
        lastShotFrame = i;
        shotsFired++;

        // Gaussian sensor noise (mean=0, stddev=2.5)
        const jitter = gaussianRandom() * 2.5;
        const rollPk = Math.max(5, Math.min(pkCeiling, adaptivePk + jitter)) * envMods.engagement * scenMods.engagement;

        events.push({
          frame: i,
          type: 'ENGAGEMENT',
          msg: `Salvo #${shotsFired} Fired — Lock: ${Math.round(rollPk)}% (Ceiling: ${pkCeiling}%)`
        });

        if (Math.random() * 100 < rollPk) {
          currentPhase = 'RESULT';
          neutralizedAt = i + 15;
          events.push({ frame: neutralizedAt, type: 'NEUTRALIZED', msg: `Target neutralized on salvo #${shotsFired}` });
        } else {
          // BOUNDED LOGISTIC ADAPTATION
          const diminishingFactor = 1 / (1 + 0.3 * shotsFired);
          const gain = (pkCeiling - adaptivePk) * systemIqValue * learningEfficiency * diminishingFactor;
          adaptivePk = Math.min(pkCeiling, adaptivePk + gain);

          events.push({
            frame: i + 10,
            type: 'FAILURE',
            msg: `Miss — Target evading. AI adapting: +${Math.round(gain)}%`
          });
        }
      }
    }

    frames.push({
      pos: currentPos,
      isEvasive: currentPosInfo.isEvasive,
      isNeutralized: neutralizedAt !== -1 && i >= neutralizedAt,
      isDetected: detectedAt !== -1 && i >= detectedAt,
      isEngaged: shotsFired > 0,
      currentPk: adaptivePk,
      phase: currentPhase,
      phaseProgress: Math.min(100, phaseProgress)
    });

    if (neutralizedAt !== -1 && i >= neutralizedAt) break;
  }

  // Generate Advanced Logic Explanation
  let explanation = "";
  if (neutralizedAt !== -1) {
    explanation = `System SUCCEEDED. The ${counter.name} effectively neutralized the threat. `;
    if (targetCount > 1) explanation += `Despite a swarm overload of ${targetCount} targets, `;
    if (envMods.lock < 1.0) explanation += `and environmental degradation due to ${weather}, `;
    explanation += `the system's high IQ (${systemIqValue}) allowed it to adapt to the ${scenario} conditions and secure a kill.`;
  } else {
    explanation = `System FAILED. The ${counter.name} could not neutralize the threat in time. `;
    if (targetCount > 1) explanation += `System overload from tracking ${targetCount} concurrent targets severely degraded lock stability (-${Math.round((1-overloadPenalty)*100)}%). `;
    if (scenMods.evasion > 1.0) explanation += `The advanced evasive patterns in the ${scenario} scenario prevented sustained targeting. `;
    if (envMods.lock < 1.0) explanation += `${weather} conditions further reduced sensor fidelity. `;
  }

  // End of simulation event if failed
  if (neutralizedAt === -1) {
    events.push({ frame: totalFrames, type: 'FAILURE', msg: 'Target reached objective. Mission Failed.' });
  }

  const result = {
    frames,
    events,
    outcome: neutralizedAt !== -1 ? 'SUCCESS' : 'FAILURE',
    basePk: Number(basePk),
    pkCeiling: Number(pkCeiling),
    finalPk: Math.round(Number(adaptivePk)),
    shotsFired: Number(shotsFired),
    iq: Number(systemIqValue),
    weather,
    scenario,
    targetCount,
    explanation
  };
  console.log('[SimEngine v4] Complete', result);
  return result;
};
