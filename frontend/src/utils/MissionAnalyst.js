/**
 * MissionAnalyst Utility
 * Provides rule-based tactical reasoning for different mission profiles
 */

const MISSION_TYPES = {
  RECON: 'Reconnaissance & ISR',
  STRIKE: 'Deep Strike / Engagement',
  LOGISTICS: 'Heavy Lift / Logistics',
  SWARM: 'Saturation / Swarm Attack'
};

const getMissionAnalyst = (drone) => {
  if (!drone || !drone.specs) return null;
  const s = drone.specs;

  const getReasoning = (type) => {
    const reasons = [];

    if (type === MISSION_TYPES.RECON) {
      if (s.stealth_level === 'High') reasons.push("Low-observable (Stealth) profile ensures high survivability in contested zones.");
      if (s.detection_range_km > 50) reasons.push(`Long-range ${s.sensor_type} sensors allow for safe stand-off surveillance.`);
      if (s.endurance_hr > 20) reasons.push("Extensive flight endurance enables persistent stationary monitoring (dwell time).");
      if (s.communication_range_km > 500) reasons.push("Extended comms range supports remote operations via beyond-line-of-sight satellite links.");
      
      if (reasons.length === 0) reasons.push("Standard tactical reconnaissance capabilities for local operations.");
    }

    if (type === MISSION_TYPES.STRIKE) {
      if (s.payload_kg > 300) reasons.push(`Significant payload capacity (${s.payload_kg}kg) supports varied precision-guided munitions.`);
      if (s.weapon_range_km > 10) reasons.push("Standoff engagement range keeps the platform outside immediate short-range air defenses.");
      if (s.jamming_resistance === 'High') reasons.push("Hardened communications shield the platform from frontline electronic warfare (EW) countermeasures.");
      if (s.speed_kmh > 300) reasons.push("High dash speed reduces the adversary's reaction time and intercept window.");
      
      if (reasons.length === 0) reasons.push("Suitable for light engagement or loitering munition roles.");
    }

    return reasons;
  };

  const scores = {
    recon: calculateReconScore(s),
    strike: calculateStrikeScore(s)
  };

  return {
    recommendation: scores.strike > scores.recon ? MISSION_TYPES.STRIKE : MISSION_TYPES.RECON,
    reasoning: getReasoning(scores.strike > scores.recon ? MISSION_TYPES.STRIKE : MISSION_TYPES.RECON),
    scores
  };
};

function calculateReconScore(s) {
  const nRange = Math.min((s.range_km || 0) / 2000, 1) * 100;
  const stealthMap = { High: 100, Medium: 60, Low: 20 };
  const nStealth = stealthMap[s.stealth_level] || 20;
  const sensorMap = { 'Multi-spectral': 100, Radar: 80, 'EO/IR': 60 };
  const nSensor = sensorMap[s.sensor_type] || 60;

  return Math.round((nRange * 0.4) + (nStealth * 0.3) + (nSensor * 0.3));
}

function calculateStrikeScore(s) {
  const nPayload = Math.min((s.payload_kg || 0) / 2000, 1) * 100;
  const nRange = Math.min((s.range_km || 0) / 2000, 1) * 100;
  const nWepRange = Math.min((s.weapon_range_km || 0) / 50, 1) * 100;

  return Math.round((nPayload * 0.4) + (nRange * 0.3) + (nWepRange * 0.3));
}

export { getMissionAnalyst, MISSION_TYPES };
