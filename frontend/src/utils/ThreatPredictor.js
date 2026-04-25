/**
 * Strategic Threat Prediction v2.0 — Composite Threat Index (CTI)
 *
 * Replaces the naive: riskScore = droneCount * range/100 + 20
 *
 * New CTI formula:
 *   CTI = w1·Arsenal + w2·Capability + w3·Intent + w4·Proximity
 *
 * Each component is normalized 0–1. Final score is 0–100.
 * Weights: Arsenal=0.25, Capability=0.30, Intent=0.20, Proximity=0.25
 */

const TYPE_THREAT_WEIGHT = {
  'HALE':      0.7,  // Strategic surveillance — high value but slower
  'MALE':      0.85, // Armed recon — primary strike platform
  'UCAV':      0.85, // Unmanned combat aerial vehicle — strike-capable platform
  'Tactical':  0.5,  // Short-range battlefield
  'Loitering': 0.95, // One-way attack — highest per-unit threat
  'Swarm':     0.9,  // Saturation threat
  'Nano':      0.2   // Minimal payload
};

/**
 * Compute the Composite Threat Index for a country relative to a reference point.
 */
function computeCTI(country, arsenal, allCountries, referencePoint = null) {
  // Normalize helpers
  const allCounts = allCountries.map(c => c.drone_count || 0);
  const maxCount = Math.max(...allCounts, 1);
  const allGrowth = allCountries.map(c => c.growth_rate || 0);
  const maxGrowth = Math.max(...allGrowth, 1);

  // 1. Arsenal Score = log-normalized drone count (0–1)
  const arsenalScore = Math.log10(Math.max(1, country.drone_count || 1)) / Math.log10(Math.max(10, maxCount));

  // 2. Capability Score = weighted average of drone type threat levels
  let capabilityScore = 0.5; // default if no arsenal data
  if (arsenal.length > 0) {
    const totalWeight = arsenal.reduce((sum, d) => sum + (TYPE_THREAT_WEIGHT[d.type] || 0.5), 0);
    capabilityScore = totalWeight / arsenal.length;

    // Bonus for range: average range above 500km gets a boost
    const avgRange = arsenal.reduce((s, d) => s + (d.specs?.range_km || 0), 0) / arsenal.length;
    capabilityScore = Math.min(1.0, capabilityScore + (avgRange > 500 ? 0.1 : 0));
  }

  // 3. Intent Score = growth rate normalized + specialization bonus
  const growthNorm = (country.growth_rate || 0) / Math.max(1, maxGrowth);
  const specBonus = (country.specialization || '').toLowerCase().includes('strike') ? 0.15 : 0;
  const intentScore = Math.min(1.0, growthNorm + specBonus);

  // 4. Proximity Score = 1 - (distance / max_range), clamped 0–1
  let proximityScore = 0.5; // neutral if no reference
  if (referencePoint && country.lat && country.lng) {
    const dist = haversine(country, referencePoint);
    const maxRange = arsenal.reduce((m, d) => Math.max(m, d.specs?.range_km || 0), 100);
    proximityScore = Math.max(0, Math.min(1.0, 1 - (dist / (maxRange * 2))));
  }

  // Weighted composite
  const cti = (arsenalScore * 0.25 + capabilityScore * 0.30 + intentScore * 0.20 + proximityScore * 0.25) * 100;

  return {
    total: Math.round(Math.max(0, Math.min(100, cti))),
    arsenal: Math.round(arsenalScore * 100),
    capability: Math.round(capabilityScore * 100),
    intent: Math.round(intentScore * 100),
    proximity: Math.round(proximityScore * 100),
    classification: classifyThreat(cti)
  };
}

function classifyThreat(score) {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  if (score >= 20) return 'LOW';
  return 'NEGLIGIBLE';
}

function haversine(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = ((p2.lng || p2.lng) - (p1.lng || p1.lng)) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate geometric threat zones with CTI scoring.
 */
export const calculateGeometricThreats = (countries, drones) => {
  if (!countries || !drones) return [];

  const threatZones = [];

  countries.forEach(country => {
    const arsenal = drones.filter(d => d.country === country.name);
    if (arsenal.length === 0) return;

    const maxRangeDrone = arsenal.reduce((prev, current) =>
      (prev.specs?.range_km > current.specs?.range_km) ? prev : current
    );

    const range = maxRangeDrone.specs?.range_km || 100;

    // Compute CTI
    const cti = computeCTI(country, arsenal, countries);

    const bases = country.strategic_bases || [{ name: 'HQ', lat: country.lat, lng: country.lng }];

    bases.forEach(base => {
      if (!base.lat || !base.lng) return;
      threatZones.push({
        id: `${country.code}-${base.name}`,
        country: country.name,
        baseName: base.name,
        center: [base.lat, base.lng],
        radius: range * 1000,
        riskScore: cti.total,
        cti,
        dominantPlatform: maxRangeDrone.name,
        type: maxRangeDrone.type
      });
    });
  });

  return threatZones;
};

/**
 * Detect high-risk patterns with CTI-aware classification.
 */
export const detectRiskPatterns = (threatZones) => {
  const patterns = [];

  // Group by country and find critical zones
  const byCountry = {};
  threatZones.forEach(z => {
    if (!byCountry[z.country]) byCountry[z.country] = [];
    byCountry[z.country].push(z);
  });

  Object.entries(byCountry).forEach(([country, zones]) => {
    const maxRisk = Math.max(...zones.map(z => z.riskScore));
    const classification = zones[0]?.cti?.classification || 'UNKNOWN';

    if (maxRisk >= 60) {
      const avgCapability = Math.round(zones.reduce((s, z) => s + (z.cti?.capability || 0), 0) / zones.length);
      patterns.push({
        type: classification === 'CRITICAL' ? 'CRITICAL_THREAT' : 'POWER_CONCENTRATION',
        location: country,
        severity: classification,
        score: maxRisk,
        reason: `CTI ${maxRisk}/100 — ${zones.length} projection base(s) with ${avgCapability}% capability index. Dominant asset: ${zones[0].dominantPlatform}.`
      });
    }
  });

  return patterns.sort((a, b) => b.score - a.score);
};
