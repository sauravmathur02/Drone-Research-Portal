/**
 * Intelligent Matchup Analyst v2.0
 * Factor-Decomposed Analysis with Sensitivity Scoring & Reasoning Chains
 *
 * Improvements over v1:
 * - Pk broken into 5 measurable factors (not a single opaque number)
 * - Sensitivity analysis: which factor matters MOST
 * - Confidence derived from data completeness (not binary 85/45)
 * - Reasoning generated from factor values, not pattern-matched keywords
 * - Alternative selection actually considers THIS drone's weaknesses
 */

const SCENARIO_COEFFICIENTS = {
  Clear:          { counter: 1.00, drone: 1.00, details: 'Standard atmospheric conditions. No environmental advantage.' },
  Urban:          { counter: 0.80, drone: 1.20, details: 'Signal clutter from structures degrades tracking. Drones exploit vertical cover.' },
  Desert:         { counter: 1.15, drone: 0.85, details: 'Unobstructed line-of-sight. High thermal contrast exposes drone signatures.' },
  Night:          { counter: 0.90, drone: 1.10, details: 'Reduced optical band effectiveness. IR-equipped systems retain advantage.' },
  'High-Jamming': { counter: 1.30, drone: 0.70, details: 'Dense EW environment disrupts drone C2 links. Autonomous drones less affected.' }
};

const STEALTH_MAP = { High: 0.8, Medium: 0.5, Low: 0.2 };
const JAM_MAP     = { High: 0.7, Medium: 0.4, Low: 0.1 };
const EFF_MAP     = { High: 0.9, Medium: 0.6, Low: 0.3 };

/**
 * Decompose the engagement into 5 measurable factors.
 * Each factor returns a signed value: positive = favors counter, negative = favors drone.
 */
function decomposeFactors(drone, counter, scenario) {
  const factors = {};
  const sd = SCENARIO_COEFFICIENTS[scenario] || SCENARIO_COEFFICIENTS.Clear;

  // F1: Range Advantage — who outranges whom
  const droneWeaponRange = drone.specs?.weapon_range_km || drone.specs?.range_km * 0.1 || 5;
  const counterRange = counter.range_km || 5;
  const rangeRatio = counterRange / Math.max(1, droneWeaponRange);
  const rangeVal = Math.round(Math.max(-15, Math.min(15, (rangeRatio - 1) * 20)));
  factors.range_advantage = {
    value: rangeVal,
    favors: rangeVal >= 0 ? 'counter' : 'drone',
    reason: rangeVal >= 0
      ? `Counter outranges drone delivery by ${(counterRange - droneWeaponRange).toFixed(1)}km — intercept before weapon release.`
      : `Drone can strike from ${Math.abs(counterRange - droneWeaponRange).toFixed(1)}km beyond counter envelope — standoff advantage.`
  };

  // F2: Signature Match — sensor type vs stealth profile
  const stealthLevel = STEALTH_MAP[drone.specs?.stealth_level] || 0.2;
  const sensorBonus = counter.sensor_type === 'Multi-sensor' ? 0.3 : counter.sensor_type === 'IR' ? 0.15 : 0;
  const sigVal = Math.round((sensorBonus - stealthLevel * 0.5) * 30);
  factors.signature_match = {
    value: sigVal,
    favors: sigVal >= 0 ? 'counter' : 'drone',
    reason: sigVal >= 0
      ? `${counter.sensor_type} sensor suite degrades ${drone.specs?.stealth_level || 'Low'}-stealth effectiveness.`
      : `${drone.specs?.stealth_level || 'Low'} stealth reduces ${counter.sensor_type || 'Radar'} tracking probability by ${Math.round(stealthLevel * 50)}%.`
  };

  // F3: EW Balance — jamming effectiveness vs resistance
  const jamResist = JAM_MAP[drone.specs?.jamming_resistance] || 0.1;
  const isEW = counter.type === 'Jamming';
  const ewVal = isEW
    ? Math.round((1 - jamResist) * 15 - 5) // EW system: effectiveness minus drone resistance
    : Math.round(-jamResist * 8);            // Non-EW: drone's jamming affects non-EW less
  factors.ew_balance = {
    value: ewVal,
    favors: ewVal >= 0 ? 'counter' : 'drone',
    reason: ewVal >= 0
      ? `Drone has ${drone.specs?.jamming_resistance || 'Low'} jamming resistance — susceptible to electronic attack.`
      : `Drone's ${drone.specs?.jamming_resistance || 'Low'} frequency hopping degrades ${counter.type} lock reliability.`
  };

  // F4: Speed Differential — does fire-control keep up?
  const speed = drone.specs?.speed_kmh || 200;
  // reaction time is used in vulnerabilities, but not in factor scoring directly.
  const trackingSpeed = counter.tracking_type === 'AI-guided' ? 1200 : counter.tracking_type === 'Fully-auto' ? 800 : 400;
  const speedDiff = trackingSpeed - speed;
  const spdVal = Math.round(Math.max(-12, Math.min(12, speedDiff / 100)));
  factors.speed_differential = {
    value: spdVal,
    favors: spdVal >= 0 ? 'counter' : 'drone',
    reason: spdVal >= 0
      ? `${counter.tracking_type || 'Semi-auto'} tracking handles ${speed}km/h target within fire-control loop.`
      : `Drone at ${speed}km/h exceeds ${counter.tracking_type || 'Semi-auto'} tracking rate — reduced engagement window.`
  };

  // F5: Environment — scenario modifier
  const envVal = Math.round((sd.counter / sd.drone - 1) * 30);
  factors.environment = {
    value: envVal,
    favors: envVal >= 0 ? 'counter' : 'drone',
    reason: sd.details
  };

  return factors;
}

/**
 * Compute a real confidence score based on data completeness.
 */
function computeConfidence(drone, counter, scenario) {
  const fields = [
    drone.specs?.stealth_level, drone.specs?.jamming_resistance,
    drone.specs?.speed_kmh, drone.specs?.range_km,
    drone.specs?.weapon_range_km, drone.specs?.sensor_type,
    counter.effectiveness, counter.range_km,
    counter.sensor_type, counter.tracking_type,
    counter.fire_control, counter.reaction_time_sec
  ];
  const present = fields.filter(f => f !== undefined && f !== null && f !== 0).length;
  const completeness = present / fields.length;

  // Scenario reliability (some scenarios are more predictable)
  const scenarioReliability = { Clear: 1.0, Desert: 0.95, Night: 0.85, Urban: 0.75, 'High-Jamming': 0.70 };
  const sr = scenarioReliability[scenario] || 0.8;

  return Math.round(completeness * sr * 100);
}

/**
 * Run sensitivity analysis: which factor shifts Pk the most?
 */
function sensitivityAnalysis(factors) {
  const entries = Object.entries(factors)
    .map(([key, f]) => ({ key, absImpact: Math.abs(f.value) }))
    .sort((a, b) => b.absImpact - a.absImpact);

  return {
    most_important: entries[0]?.key || 'unknown',
    least_important: entries[entries.length - 1]?.key || 'unknown',
    ranked: entries.map(e => e.key)
  };
}

/**
 * Generate vulnerabilities from factor analysis (not hardcoded patterns).
 */
function detectVulnerabilities(drone, counter, factors) {
  const vulns = { drone: [], counter: [] };

  // Drone vulnerabilities (negative factor values = drone weakness)
  if (factors.ew_balance.value > 5) vulns.drone.push(`${drone.specs?.jamming_resistance || 'Low'} jamming resistance is exploitable by EW systems.`);
  if (factors.signature_match.value > 5) vulns.drone.push(`${drone.specs?.stealth_level || 'Low'} stealth profile is detectable by ${counter.sensor_type || 'Radar'} sensors.`);
  if ((drone.specs?.speed_kmh || 200) < 300) vulns.drone.push('Low flight speed increases time inside engagement envelope.');

  // Counter vulnerabilities
  if (factors.range_advantage.value < -5) vulns.counter.push(`Drone outranges counter by ${Math.abs(factors.range_advantage.value)}+ km — standoff threat.`);
  if (factors.speed_differential.value < -5) vulns.counter.push(`Fire-control loop too slow for ${drone.specs?.speed_kmh || 200}km/h target.`);
  if ((counter.simultaneous_targets || 1) <= 1) vulns.counter.push('Single-target tracking — vulnerable to saturation attacks.');
  if ((counter.reaction_time_sec || 10) > 8) vulns.counter.push(`Reaction time of ${counter.reaction_time_sec || 10}s limits first-shot opportunity.`);

  return vulns;
}

/**
 * Find the best alternative counter for THIS specific drone.
 */
function findBestAlternative(drone, counter, allCounters, scenario) {
  if (!allCounters || allCounters.length === 0) return null;

  return allCounters
    .filter(c => c._id !== counter._id)
    .map(c => {
      // Quick factor decomposition for ranking
      const f = decomposeFactors(drone, c, scenario);
      const totalScore = Object.values(f).reduce((sum, factor) => sum + factor.value, 0);
      return { ...c, totalScore, pk_estimate: Math.round(50 + totalScore) };
    })
    .sort((a, b) => b.totalScore - a.totalScore)[0] || null;
}

/**
 * Main Entry Point: Generate an Intelligent Tactical Report
 */
export const generateIntelligentReport = (drone, counter, scenario = 'Clear', allCounters = []) => {
  if (!drone || !counter) return null;

  // 1. Factor Decomposition
  const factors = decomposeFactors(drone, counter, scenario);

  // 2. Aggregate Pk from factors
  const totalFactorValue = Object.values(factors).reduce((sum, f) => sum + f.value, 0);
  const baseEffectiveness = EFF_MAP[counter.effectiveness] || 0.6;
  const scenarioPk = Math.round(Math.max(5, Math.min(95, baseEffectiveness * 100 + totalFactorValue)));

  // 3. Sensitivity Analysis
  const sensitivity = sensitivityAnalysis(factors);

  // 4. Confidence Score
  const confidenceScore = computeConfidence(drone, counter, scenario);

  // 5. Vulnerability Detection
  const vulnerabilities = detectVulnerabilities(drone, counter, factors);

  // 6. Reasoning Chain (generated from factors, not pattern-matching)
  const reasoning = Object.entries(factors)
    .filter(([, f]) => Math.abs(f.value) >= 3)
    .sort(([, a], [, b]) => Math.abs(b.value) - Math.abs(a.value))
    .map(([, f]) => f.reason);

  if (reasoning.length === 0) {
    reasoning.push('No single factor dominates this engagement. Outcome is probabilistic and contested.');
  }

  // 7. Best Alternative
  const bestAlternative = findBestAlternative(drone, counter, allCounters, scenario);

  // 8. Verdict
  let verdict = 'CONTESTED';
  if (scenarioPk >= 55) verdict = 'DEFENSE_DOMINANT';
  else if (scenarioPk <= 25) verdict = 'THREAT_DOMINANT';

  return {
    scenarioPk,
    scenarioDetails: (SCENARIO_COEFFICIENTS[scenario] || SCENARIO_COEFFICIENTS.Clear).details,
    factors,
    sensitivity,
    reasoning,
    vulnerabilities,
    confidenceScore,
    bestAlternative,
    verdict
  };
};
