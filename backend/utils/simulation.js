/**
 * 1. Academic UAV Flight Physics, Momentum Theory & Battery Endurance Calculator
 */
function calculateFlightPhysics({
  frameWeightKg = 1.8,
  batteryWeightKg = 0.9,
  payloadWeightKg = 0.6,
  batteryCapacityMah = 12000,
  batteryVoltageV = 22.2,
  rotorCount = 4,
  propDiameterInch = 15,
  maxThrustPerMotorKg = 2.4,
  altitudeMeters = 500
}) {
  const totalWeightKg = Number(frameWeightKg) + Number(batteryWeightKg) + Number(payloadWeightKg);
  const totalMaxThrustKg = Number(rotorCount) * Number(maxThrustPerMotorKg);

  // International Standard Atmosphere (ISA) air density approximation vs altitude
  const seaLevelRho = 1.225;
  const rho = +(seaLevelRho * Math.exp(-Number(altitudeMeters) / 8500)).toFixed(3);

  // Effective thrust drops with air density ratio
  const densityRatio = rho / seaLevelRho;
  const altitudeAdjustedThrustKg = +(totalMaxThrustKg * densityRatio).toFixed(2);
  const thrustToWeightRatio =
    totalWeightKg > 0 ? +(altitudeAdjustedThrustKg / totalWeightKg).toFixed(2) : 0;

  const propRadiusM = (Number(propDiameterInch) * 0.0254) / 2;
  const totalDiskAreaM2 = Number(rotorCount) * Math.PI * Math.pow(propRadiusM, 2);

  // Ideal Hover Power via Actuator Disk Momentum Theory: P = T^(3/2) / sqrt(2 * rho * A)
  const weightNewtons = totalWeightKg * 9.81;
  const figureOfMerit = 0.72;
  const inducedHoverPowerW =
    totalDiskAreaM2 > 0
      ? Math.pow(weightNewtons, 1.5) / (Math.sqrt(2 * rho * totalDiskAreaM2) * figureOfMerit)
      : 0;

  const avionicsPowerW = 35;
  const totalHoverPowerW = inducedHoverPowerW + avionicsPowerW;
  const hoverCurrentAmps = batteryVoltageV > 0 ? totalHoverPowerW / batteryVoltageV : 0;

  // 80% safe LiPo depth of discharge
  const usableCapacityAh = (Number(batteryCapacityMah) / 1000) * 0.8;
  const hoverEnduranceMinutes =
    hoverCurrentAmps > 0 ? +((usableCapacityAh / hoverCurrentAmps) * 60).toFixed(1) : 0;

  let flightViability = 'Optimal Envelope';
  const warnings = [];

  if (thrustToWeightRatio < 1.2) {
    flightViability = 'Critical: Insufficient Thrust';
    warnings.push(
      `At ${altitudeMeters}m altitude (ρ = ${rho} kg/m³), Thrust-to-Weight is ${thrustToWeightRatio}:1 (< 1.2:1 minimum).`
    );
  } else if (thrustToWeightRatio < 1.8) {
    flightViability = 'Marginal: Heavy Payload';
    warnings.push('Thrust-to-Weight is below 1.8:1. Expect reduced gust rejection and climb rate.');
  }

  return {
    totalWeightKg: +totalWeightKg.toFixed(2),
    totalMaxThrustKg: altitudeAdjustedThrustKg,
    airDensityKgM3: rho,
    thrustToWeightRatio,
    hoverPowerWatts: Math.round(totalHoverPowerW),
    hoverCurrentAmps: +hoverCurrentAmps.toFixed(1),
    hoverEnduranceMinutes,
    diskLoadingKgM2: totalDiskAreaM2 > 0 ? +(totalWeightKg / totalDiskAreaM2).toFixed(2) : 0,
    flightViability,
    warnings
  };
}

/**
 * 2. Tactical Counter-UAS Detection & Interception Simulation (Used with CounterSystem.js)
 */
function simulateEngagement(drone, counterSystem, environment = {}) {
  if (!drone || !counterSystem) {
    return { successProbability: 0, summary: 'Missing drone or counter-system parameters.' };
  }

  const rcs = drone.tacticalData?.radarCrossSectionM2 || 0.15;
  const ewResilience = drone.tacticalData?.ewResilience || 65;
  const speedKmh = drone.specifications?.maxSpeedKmh || 150;

  let baseScore = Number(counterSystem.effectiveness || 75);

  // Adjust for Radar Cross Section & Speed
  if (rcs < 0.05) baseScore -= 12; // Stealth/Nano UAV harder to track
  if (speedKmh > 350) baseScore -= 8;

  // Electronic Warfare vs EW resilience
  const isEW = /EW|Jammer|Cyber|SkyFence/i.test(counterSystem.type || counterSystem.name);
  if (isEW) {
    baseScore -= (ewResilience - 50) * 0.35;
  }

  // Weather degradation (Rain/Fog affects Directed Energy Laser like Iron Beam)
  const isLaser = /Laser|Directed Energy|Iron Beam/i.test(counterSystem.type || counterSystem.name);
  if (isLaser && /Rain|Fog|Storm/i.test(environment.weather || '')) {
    baseScore -= 22;
  }

  const finalProbability = Math.max(10, Math.min(98, Math.round(baseScore)));

  return {
    droneName: drone.name,
    counterSystemName: counterSystem.name,
    environment,
    detectionRangeKm: +(Math.pow(rcs, 0.25) * 18).toFixed(1),
    successProbability: finalProbability,
    outcomeRating:
      finalProbability >= 80
        ? 'High Interception Confidence'
        : finalProbability >= 55
        ? 'Moderate Contested Engagement'
        : 'Low Probability (Target Evades)',
    technicalBreakdown: [
      `Target Radar Cross Section (RCS): ${rcs} m²`,
      `Target EW Resilience Index: ${ewResilience}/100`,
      `Counter-System Modality: ${counterSystem.type || 'Multi-Layered C-UAS'}`
    ]
  };
}

module.exports = {
  calculateFlightPhysics,
  simulateEngagement,
  computePk: simulateEngagement
};
