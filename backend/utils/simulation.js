/**
 * Aerospace Physics & Academic UAV Flight Calculator
 */
function calculateFlightPhysics({
  frameWeightKg = 1.5,
  batteryWeightKg = 0.8,
  payloadWeightKg = 0.5,
  batteryCapacityMah = 10000,
  batteryVoltageV = 22.2, // 6S LiPo
  rotorCount = 4,
  propDiameterInch = 15,
  motorKv = 380,
  maxThrustPerMotorKg = 2.2
}) {
  const totalWeightKg = Number(frameWeightKg) + Number(batteryWeightKg) + Number(payloadWeightKg);
  const totalMaxThrustKg = Number(rotorCount) * Number(maxThrustPerMotorKg);
  const thrustToWeightRatio = totalWeightKg > 0 ? +(totalMaxThrustKg / totalWeightKg).toFixed(2) : 0;

  // Air density at sea level (kg/m^3)
  const rho = 1.225;
  const propRadiusM = (Number(propDiameterInch) * 0.0254) / 2;
  const totalDiskAreaM2 = Number(rotorCount) * Math.PI * Math.pow(propRadiusM, 2);

  // Ideal Hover Power via Momentum Theory: P_ideal = (T^(3/2)) / sqrt(2 * rho * A)
  const weightNewtons = totalWeightKg * 9.81;
  const figureOfMerit = 0.72; // Typical multirotor efficiency (72%)
  const hoverPowerWatts =
    totalDiskAreaM2 > 0
      ? Math.pow(weightNewtons, 1.5) / (Math.sqrt(2 * rho * totalDiskAreaM2) * figureOfMerit)
      : 0;

  // Avionics & ESC overhead (~35W)
  const totalHoverPowerW = hoverPowerWatts + 35;
  const hoverCurrentAmps = batteryVoltageV > 0 ? totalHoverPowerW / batteryVoltageV : 0;

  // Usable battery energy (80% depth of discharge for LiPo safety)
  const usableCapacityAh = (Number(batteryCapacityMah) / 1000) * 0.8;
  const hoverEnduranceMinutes =
    hoverCurrentAmps > 0 ? +((usableCapacityAh / hoverCurrentAmps) * 60).toFixed(1) : 0;

  // Flight safety & academic assessment
  let flightViability = 'Optimal';
  const warnings = [];

  if (thrustToWeightRatio < 1.2) {
    flightViability = 'Cannot Take Off / Unsafe';
    warnings.push('Thrust-to-weight ratio is below 1.2:1. The UAV cannot maintain controlled hover.');
  } else if (thrustToWeightRatio < 1.8) {
    flightViability = 'Sluggish (Heavy Payload)';
    warnings.push('Thrust-to-weight ratio is under 2.0:1. Reduced wind resistance and slow climb rate.');
  }

  return {
    totalWeightKg: +totalWeightKg.toFixed(2),
    totalMaxThrustKg: +totalMaxThrustKg.toFixed(2),
    thrustToWeightRatio,
    hoverPowerWatts: Math.round(totalHoverPowerW),
    hoverCurrentAmps: +hoverCurrentAmps.toFixed(1),
    hoverEnduranceMinutes,
    diskLoadingKgM2: totalDiskAreaM2 > 0 ? +(totalWeightKg / totalDiskAreaM2).toFixed(2) : 0,
    flightViability,
    warnings
  };
}

module.exports = { calculateFlightPhysics };
