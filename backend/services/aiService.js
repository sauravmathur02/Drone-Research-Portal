const Country = require('../models/Country');
const Drone = require('../models/Drone');
const CounterSystem = require('../models/CounterSystem');

const SOURCE_LABEL = 'DroneScope Intelligence DB';

// ─── ALIAS MAP ─────────────────────────────────────────────
const DRONE_ALIASES = {
  'mq9': 'MQ-9 Reaper', 'reaper': 'MQ-9 Reaper', 'mq 9': 'MQ-9 Reaper',
  'mq1': 'MQ-1 Predator', 'predator': 'MQ-1 Predator', 'mq 1': 'MQ-1 Predator',
  'global hawk': 'RQ-4 Global Hawk', 'rq4': 'RQ-4 Global Hawk', 'rq 4': 'RQ-4 Global Hawk',
  'heron': 'Heron TP', 'heron tp': 'Heron TP',
  'tapas': 'TAPAS BH-201', 'rustom': 'TAPAS BH-201',
  'bayraktar': 'Bayraktar TB2', 'tb2': 'Bayraktar TB2',
  'shahed': 'Shahed 136', 'shahed 136': 'Shahed 136', 'shahed136': 'Shahed 136',
  'wing loong': 'Wing Loong II', 'wing loong 2': 'Wing Loong II', 'wing loong ii': 'Wing Loong II',
  'ch4': 'CH-4', 'ch 4': 'CH-4', 'ch5': 'CH-5', 'ch 5': 'CH-5',
  'harop': 'Harop', 'harpy': 'Harpy',
  'orion': 'Orion', 's70': 'S-70 Okhotnik', 'okhotnik': 'S-70 Okhotnik', 'hunter': 'S-70 Okhotnik',
  'switchblade': 'Switchblade 600', 'switchblade600': 'Switchblade 600',
  'kargu': 'Kargu-2', 'kargu2': 'Kargu-2',
  'mohajer': 'Mohajer-6', 'mohajer6': 'Mohajer-6',
  'anka': 'TAI Anka', 'akinci': 'Bayraktar Akinci',
  'hermes': 'Hermes 900', 'hermes900': 'Hermes 900', 'hermes 900': 'Hermes 900',
  'neuron': 'nEUROn', 'ucav': 'UCAV',
};

const COUNTER_ALIASES = {
  'iron dome': 'Iron Dome', 'irondome': 'Iron Dome',
  'pantsir': 'Pantsir-S1', 'pantsir s1': 'Pantsir-S1',
  'iron beam': 'Iron Beam', 'ironbeam': 'Iron Beam',
  'drone guard': 'DroneGuard', 'droneguard': 'DroneGuard',
  'centurion': 'Centurion C-RAM', 'cram': 'Centurion C-RAM', 'c ram': 'Centurion C-RAM',
  'skylock': 'SkyLock', 'sky lock': 'SkyLock',
};

// ─── TEXT UTILITIES ──────────────────────────────────────────
function normalize(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[b.length][a.length];
}

function tokenSimilarity(query, target) {
  const qTokens = normalize(query).split(' ').filter(t => t.length > 1);
  const tTokens = normalize(target).split(' ').filter(t => t.length > 1);
  if (!qTokens.length || !tTokens.length) return 0;

  let matches = 0;
  for (const qt of qTokens) {
    for (const tt of tTokens) {
      if (tt.includes(qt) || qt.includes(tt)) { matches++; break; }
      if (levenshtein(qt, tt) <= Math.max(1, Math.floor(Math.min(qt.length, tt.length) / 3))) { matches++; break; }
    }
  }
  return matches / Math.max(qTokens.length, tTokens.length);
}

function buildSearchText(drone) {
  return [
    drone.name, drone.type, drone.country,
    drone.specs?.sensor_type, drone.specs?.stealth_level,
    drone.specs?.jamming_resistance,
    `range ${drone.specs?.range_km}`, `speed ${drone.specs?.speed_kmh}`,
  ].filter(Boolean).join(' ');
}

// ─── INTENT CLASSIFICATION ───────────────────────────────────
const INTENT_PATTERNS = [
  { intent: 'recommend',      patterns: ['best counter', 'how to defend', 'how to stop', 'what can stop', 'counter for', 'defense against', 'defence against', 'neutralize', 'neutralise', 'shoot down'] },
  { intent: 'compare',        patterns: ['compare', ' vs ', 'versus', 'difference between', 'which is better'] },
  { intent: 'lookup',         patterns: ['specs of', 'tell me about', 'what is', 'info on', 'details of', 'show me', 'describe'] },
  { intent: 'threat',         patterns: ['threat', 'dangerous', 'risk', 'hardest to detect', 'most stealthy', 'fastest', 'longest range', 'most lethal'] },
  { intent: 'tactical',       patterns: ['swarm', 'loitering', 'kamikaze', 'saturation attack', 'night ops', 'urban warfare'] },
  { intent: 'counter_systems', patterns: ['counter system', 'counter drone', 'jamming', 'laser defense', 'anti drone', 'anti uav'] },
  { intent: 'drone_count',    patterns: ['how many', 'drone count', 'fleet size', 'inventory', 'drones does'] },
  { intent: 'country',        patterns: ['india drone', 'china drone', 'usa drone', 'israel drone', 'russia drone', 'turkey drone', 'iran drone'] },
];

function classifyIntent(query) {
  const q = normalize(query);
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some(p => q.includes(p))) return intent;
  }
  // Fallback: check if query mentions a drone name
  return 'general';
}

// ─── ENTITY EXTRACTION (FUZZY) ───────────────────────────────
async function extractEntities(query) {
  const q = normalize(query);
  const allDrones = await Drone.find().lean();
  const allCounters = await CounterSystem.find().lean();
  const allCountries = await Country.find().sort({ drone_count: -1 }).lean();

  // Check alias mapping first
  let matchedDrone = null;
  let matchedCounter = null;

  for (const [alias, realName] of Object.entries(DRONE_ALIASES)) {
    if (q.includes(alias)) {
      matchedDrone = allDrones.find(d => normalize(d.name).includes(normalize(realName)));
      if (matchedDrone) break;
    }
  }

  for (const [alias, realName] of Object.entries(COUNTER_ALIASES)) {
    if (q.includes(alias)) {
      matchedCounter = allCounters.find(c => normalize(c.name).includes(normalize(realName)));
      if (matchedCounter) break;
    }
  }

  // Fuzzy match if alias didn't hit
  if (!matchedDrone) {
    let bestScore = 0;
    for (const d of allDrones) {
      const score = Math.max(
        tokenSimilarity(query, d.name),
        tokenSimilarity(query, buildSearchText(d)) * 0.7
      );
      if (score > bestScore && score > 0.25) { matchedDrone = d; bestScore = score; }
    }
  }

  if (!matchedCounter) {
    let bestScore = 0;
    for (const c of allCounters) {
      const score = tokenSimilarity(query, c.name);
      if (score > bestScore && score > 0.25) { matchedCounter = c; bestScore = score; }
    }
  }

  // Top 3 closest drones for fallback
  const scoredDrones = allDrones.map(d => ({
    drone: d,
    score: Math.max(tokenSimilarity(query, d.name), tokenSimilarity(query, buildSearchText(d)) * 0.6)
  })).sort((a, b) => b.score - a.score);

  const closestDrones = scoredDrones.slice(0, 3);

  // Country matching
  const matchedCountries = findCountriesInText(query, allCountries);

  return { drone: matchedDrone, counter: matchedCounter, allDrones, allCounters, allCountries, closestDrones, matchedCountries };
}

function countryAliases(country) {
  const aliases = [country.name, country.code];
  if (country.code === 'USA') aliases.push('us', 'u s', 'america', 'american', 'united states');
  if (country.code === 'CHN') aliases.push('china', 'chinese');
  if (country.code === 'IND') aliases.push('india', 'indian');
  if (country.code === 'RUS') aliases.push('russia', 'russian');
  if (country.code === 'ISR') aliases.push('israel', 'israeli');
  if (country.code === 'TUR') aliases.push('turkey', 'turkish', 'turkiye');
  if (country.code === 'IRN') aliases.push('iran', 'iranian');
  return aliases.map(normalize);
}

function findCountriesInText(text, countries) {
  const n = normalize(text);
  return countries.filter(c => countryAliases(c).some(a => n.includes(a)));
}

// ─── CONFIDENCE CALCULATOR ───────────────────────────────────
function computeConfidence({ similarity = 0, queryQuality = 0.5, dataCompleteness = 0.5, pkValue = 0 }) {
  const raw = (0.3 * similarity) + (0.2 * queryQuality) + (0.2 * dataCompleteness) + (0.3 * pkValue);
  return Math.round(Math.max(0.05, Math.min(1, raw)) * 100) / 100;
}

function queryQualityScore(query) {
  const words = normalize(query).split(' ').filter(t => t.length > 1);
  if (words.length >= 4) return 0.9;
  if (words.length >= 2) return 0.6;
  return 0.3;
}

function droneDataCompleteness(drone) {
  if (!drone) return 0;
  const fields = ['speed_kmh', 'range_km', 'endurance_hr', 'payload_kg', 'stealth_level', 'jamming_resistance', 'sensor_type'];
  const present = fields.filter(f => drone.specs?.[f] != null).length;
  return present / fields.length;
}

// ─── TOOL: RECOMMEND COUNTER ─────────────────────────────────
async function toolRecommend(entities, query) {
  const { drone, allDrones, allCounters, closestDrones } = entities;

  let targetDrone = drone;
  if (!targetDrone) {
    // Fallback: use closest match
    targetDrone = closestDrones[0]?.drone;
  }

  if (!targetDrone) {
    return {
      analysis: `Could not identify a specific drone from your query. The database contains ${allDrones.length} platforms. Try specifying a name like "MQ-9 Reaper" or a type like "Loitering".`,
      recommendation: allCounters.length > 0 ? `Available counter systems: ${allCounters.slice(0, 3).map(c => c.name).join(', ')}` : 'No counter systems in database.',
      confidence: computeConfidence({ similarity: 0.1, queryQuality: queryQualityScore(query), dataCompleteness: 0.3 }),
    };
  }

  const stealthPenalty = targetDrone.specs?.stealth_level === 'High' ? 0.35 : targetDrone.specs?.stealth_level === 'Medium' ? 0.2 : 0;
  const speedPenalty = (targetDrone.specs?.speed_kmh || 200) > 600 ? 0.12 : 0;

  const scored = allCounters.map(c => {
    const baseEff = c.effectiveness === 'High' ? 0.85 : c.effectiveness === 'Medium' ? 0.55 : 0.30;
    const typeBonus = (c.type === 'Jamming' && targetDrone.specs?.jamming_resistance === 'Low') ? 0.15
      : (c.type === 'Missile' && targetDrone.specs?.stealth_level === 'Low') ? 0.10
      : (c.type === 'Laser' && (targetDrone.specs?.speed_kmh || 200) < 400) ? 0.10
      : 0;
    const pk = Math.min(0.95, baseEff + typeBonus - stealthPenalty - speedPenalty);
    return { ...c, pk };
  }).sort((a, b) => b.pk - a.pk);

  const best = scored[0];
  const runner = scored[1];

  const similarity = drone ? 0.95 : (closestDrones[0]?.score || 0.3);

  return {
    analysis: `Against ${targetDrone.name} (${targetDrone.type}, Stealth: ${targetDrone.specs?.stealth_level || 'Low'}, Speed: ${targetDrone.specs?.speed_kmh || '?'}km/h), the optimal counter-system is ${best.name} (${best.type}) with an estimated Pk of ${Math.round(best.pk * 100)}%.${runner ? ` Runner-up: ${runner.name} (Pk: ${Math.round(runner.pk * 100)}%).` : ''}`,
    recommendation: `Deploy ${best.name} as primary interceptor. ${targetDrone.specs?.stealth_level === 'High' ? 'Multi-sensor fusion (IR + Radar) recommended for detection.' : targetDrone.specs?.jamming_resistance === 'Low' ? 'EW jamming of datalink is highly effective.' : 'Standard engagement protocol.'}`,
    confidence: computeConfidence({ similarity, queryQuality: queryQualityScore(query), dataCompleteness: droneDataCompleteness(targetDrone), pkValue: best.pk }),
  };
}

// ─── TOOL: LOOKUP ────────────────────────────────────────────
async function toolLookup(entities, query) {
  const { drone, counter, closestDrones } = entities;
  const target = drone || counter;

  if (!target) {
    const fallbacks = closestDrones.filter(c => c.score > 0.1).slice(0, 3);
    if (fallbacks.length > 0) {
      const names = fallbacks.map(f => f.drone.name).join(', ');
      return {
        analysis: `Exact match not found. Closest matches in database: ${names}.`,
        recommendation: `Try searching specifically for: "${fallbacks[0].drone.name}"`,
        confidence: computeConfidence({ similarity: fallbacks[0].score, queryQuality: queryQualityScore(query), dataCompleteness: 0.5 }),
      };
    }
    return {
      analysis: 'Could not identify the asset in the database. Try a specific platform name like "MQ-9 Reaper" or "Iron Dome".',
      recommendation: 'Browse the Drone Database page for the full registry.',
      confidence: 0.1,
    };
  }

  const isDrone = !!target.specs;
  if (isDrone) {
    return {
      analysis: `${target.name} — ${target.type} class UAV operated by ${target.country}. Speed: ${target.specs.speed_kmh}km/h, Range: ${target.specs.range_km}km, Endurance: ${target.specs.endurance_hr}hr, Payload: ${target.specs.payload_kg}kg. Stealth: ${target.specs.stealth_level}, Jam Resist: ${target.specs.jamming_resistance}. Sensor: ${target.specs.sensor_type}.`,
      recommendation: `${target.specs.stealth_level === 'High' ? 'High-stealth platform — requires multi-sensor fusion for detection.' : target.type === 'Loitering' ? 'One-way attack system — prioritize EW disruption of C2 link.' : 'Standard engagement profile.'} Procurement: $${(target.specs.price_usd || 0).toLocaleString()} USD.`,
      confidence: computeConfidence({ similarity: 0.95, queryQuality: queryQualityScore(query), dataCompleteness: droneDataCompleteness(target) }),
    };
  } else {
    return {
      analysis: `${target.name} — ${target.type} counter-drone system. Range: ${target.range_km}km, Effectiveness: ${target.effectiveness}. Effective against: ${(target.effective_against || []).join(', ')}.`,
      recommendation: `Sensor: ${target.sensor_type || 'Unknown'}, Tracking: ${target.tracking_type || 'Unknown'}, Fire Control: ${target.fire_control || 'Unknown'}, Reaction: ${target.reaction_time_sec || '?'}s.`,
      confidence: computeConfidence({ similarity: 0.95, queryQuality: queryQualityScore(query), dataCompleteness: 0.8 }),
    };
  }
}

// ─── TOOL: THREAT ANALYSIS ───────────────────────────────────
async function toolThreat(entities, query) {
  const { allDrones } = entities;
  const q = normalize(query);

  let sorted, label;
  if (q.includes('stealth') || q.includes('detect')) {
    sorted = allDrones.filter(d => d.specs?.stealth_level === 'High').sort((a, b) => (b.specs?.range_km || 0) - (a.specs?.range_km || 0));
    label = 'highest stealth profile';
  } else if (q.includes('fastest') || q.includes('speed')) {
    sorted = [...allDrones].sort((a, b) => (b.specs?.speed_kmh || 0) - (a.specs?.speed_kmh || 0));
    label = 'fastest platform';
  } else if (q.includes('longest range') || q.includes('range')) {
    sorted = [...allDrones].sort((a, b) => (b.specs?.range_km || 0) - (a.specs?.range_km || 0));
    label = 'longest operational range';
  } else if (q.includes('lethal') || q.includes('payload')) {
    sorted = [...allDrones].sort((a, b) => (b.specs?.payload_kg || 0) - (a.specs?.payload_kg || 0));
    label = 'highest payload capacity';
  } else {
    sorted = [...allDrones].sort((a, b) => (b.specs?.range_km || 0) - (a.specs?.range_km || 0));
    label = 'highest strategic threat';
  }

  const top = sorted[0];
  if (!top) return { analysis: 'No drones found in database for threat analysis.', recommendation: 'Populate the drone registry.', confidence: 0.1 };

  return {
    analysis: `${top.name} (${top.type}, ${top.country}) has the ${label} in the database. Speed: ${top.specs?.speed_kmh || '?'}km/h, Range: ${top.specs?.range_km || '?'}km, Stealth: ${top.specs?.stealth_level || 'Unknown'}. ${sorted.length > 1 ? `Runner-up: ${sorted[1].name}.` : ''}`,
    recommendation: `Counter-strategy: ${top.specs?.stealth_level === 'High' ? 'Multi-sensor fusion (IR + Radar) required.' : (top.specs?.speed_kmh || 0) > 600 ? 'AI-guided tracking with < 3s reaction time.' : 'Standard layered defense.'}`,
    confidence: computeConfidence({ similarity: 0.8, queryQuality: queryQualityScore(query), dataCompleteness: droneDataCompleteness(top), pkValue: 0.5 }),
  };
}

// ─── TOOL: TACTICAL DOCTRINE ─────────────────────────────────
function toolTactical(query) {
  const q = normalize(query);
  let analysis, recommendation;

  if (q.includes('swarm')) {
    analysis = 'Swarm attacks use 10-100+ low-cost drones to overwhelm point defense systems through saturation. The key challenge is cost-exchange ratio — a $500k missile vs a $2k drone is unsustainable.';
    recommendation = 'Deploy wide-area EW jamming to disrupt C2 links, backed by high-RPM CIWS for leakers. Systems with < 3 simultaneous engagement channels will be saturated. Prioritize systems like DroneGuard or Centurion C-RAM.';
  } else if (q.includes('loitering') || q.includes('kamikaze')) {
    analysis = 'Loitering munitions orbit a target area and dive on confirmed targets. They have low RCS, low speed, and most lack autonomous navigation — making C2 disruption highly effective.';
    recommendation = 'Primary counter: EW jamming of GPS/datalink. Secondary: IR-guided point defense. Avoid expensive missile interceptors for cost efficiency.';
  } else if (q.includes('night')) {
    analysis = 'Night operations favor drones with IR sensors and reduce visual detection. Counter-systems relying on optical tracking suffer significant degradation.';
    recommendation = 'Deploy radar-primary systems with thermal backup. Avoid systems dependent on EO/IR only. Synthetic aperture radar provides advantage.';
  } else if (q.includes('urban')) {
    analysis = 'Urban environments create signal clutter, limit line-of-sight, and increase collateral damage risk. Drones can exploit vertical cover from structures.';
    recommendation = 'Use distributed sensor networks. Avoid wide-area jamming (civilian infrastructure risk). Point-defense lasers preferred for precision engagement.';
  } else {
    analysis = 'Tactical scenario analysis is available for: swarm attacks, loitering munitions, night operations, and urban warfare. Specify a scenario for detailed doctrine.';
    recommendation = 'Try: "How to defend against swarm drones?" or "Best tactics for urban counter-drone?"';
  }

  return { analysis, recommendation, confidence: analysis.length > 100 ? 0.82 : 0.5 };
}

// ─── TOOL: COUNTER SYSTEMS INFO ──────────────────────────────
async function toolCounterSystems(entities, query) {
  const { allCounters } = entities;
  const q = normalize(query);
  const threatTypes = ['Swarm', 'Nano', 'Tactical', 'MALE', 'HALE', 'Loitering'];
  const matchedThreat = threatTypes.find(t => q.includes(t.toLowerCase())) || null;

  let relevant = allCounters;
  if (matchedThreat) {
    relevant = allCounters.filter(c => (c.effective_against || []).includes(matchedThreat));
    if (relevant.length === 0) relevant = allCounters;
  }

  const top3 = relevant.slice(0, 3);
  const summary = top3.map(c => `${c.name} (${c.type}, ${c.effectiveness} eff., ${c.range_km}km)`).join('; ');

  return {
    analysis: matchedThreat
      ? `For ${matchedThreat} drone threats, the top mapped counter-systems are: ${summary}.`
      : `Top counter-drone systems in database: ${summary}. Total: ${allCounters.length} systems registered.`,
    recommendation: `These systems are selected based on effectiveness rating and threat-class compatibility. ${top3[0]?.name || 'First system'} is recommended as primary layer.`,
    confidence: computeConfidence({ similarity: 0.7, queryQuality: queryQualityScore(query), dataCompleteness: 0.8 }),
  };
}

// ─── TOOL: COUNTRY ANALYSIS ─────────────────────────────────
async function toolCountryAnalysis(entities, query, previousQuery) {
  const { allDrones, matchedCountries, allCountries } = entities;

  let country = matchedCountries[0];
  if (!country && previousQuery) {
    country = findCountriesInText(previousQuery, allCountries)[0];
  }
  if (!country) country = allCountries[0];

  if (!country) {
    return {
      analysis: 'Could not identify a country. Try asking about India, China, United States, Russia, Israel, Turkey, or Iran.',
      recommendation: 'Use the Global Command page for a visual overview of all drone powers.',
      confidence: 0.15,
    };
  }

  const drones = allDrones.filter(d => normalize(d.country).includes(normalize(country.name)));
  const types = [...new Set(drones.map(d => d.type))].join(', ') || country.specialization;
  const topNames = drones.slice(0, 3).map(d => d.name).join(', ') || (country.top_drones || []).join(', ') || 'N/A';

  return {
    analysis: `${country.name} is a ${country.specialization} drone power with approximately ${(country.drone_count || 0).toLocaleString()} drones and ${country.growth_rate || 0}% YoY growth. Emphasis on: ${types}. Notable platforms: ${topNames}.`,
    recommendation: `${country.growth_rate > 10 ? 'High growth trajectory — monitor procurement pipeline.' : 'Stable capability — focus on platform quality assessment.'} Fleet size ranks ${allCountries.indexOf(country) + 1}/${allCountries.length} globally.`,
    confidence: computeConfidence({ similarity: 0.85, queryQuality: queryQualityScore(query), dataCompleteness: 0.75 }),
  };
}

// ─── TOOL: COMPARE ───────────────────────────────────────────
async function toolCompare(entities, query) {
  const { drone, counter, allDrones, matchedCountries, allCountries } = entities;

  // Country comparison
  if (matchedCountries.length >= 2) {
    const [a, b] = matchedCountries;
    const aDrones = allDrones.filter(d => normalize(d.country).includes(normalize(a.name)));
    const bDrones = allDrones.filter(d => normalize(d.country).includes(normalize(b.name)));
    const leader = (a.drone_count || 0) >= (b.drone_count || 0) ? a : b;
    const gap = Math.abs((a.drone_count || 0) - (b.drone_count || 0));

    return {
      analysis: `${a.name} vs ${b.name}: ${a.name} fields ~${(a.drone_count || 0).toLocaleString()} drones (${a.specialization}), ${b.name} fields ~${(b.drone_count || 0).toLocaleString()} drones (${b.specialization}). ${leader.name} leads by ~${gap.toLocaleString()} units. ${a.name} platforms: ${aDrones.slice(0, 2).map(d => d.name).join(', ') || 'N/A'}. ${b.name} platforms: ${bDrones.slice(0, 2).map(d => d.name).join(', ') || 'N/A'}.`,
      recommendation: `Growth: ${a.name} +${a.growth_rate || 0}% vs ${b.name} +${b.growth_rate || 0}% YoY. ${leader.name} currently has the quantitative advantage.`,
      confidence: 0.85,
    };
  }

  // Drone vs Counter
  if (drone && counter) {
    return {
      analysis: `${drone.name} (${drone.type}, ${drone.country}) — Speed: ${drone.specs?.speed_kmh}km/h, Range: ${drone.specs?.range_km}km, Stealth: ${drone.specs?.stealth_level}. vs ${counter.name} (${counter.type}) — Range: ${counter.range_km}km, Effectiveness: ${counter.effectiveness}.`,
      recommendation: `Use the Threat Matchup page for a full factor-decomposed analysis with Pk calculations.`,
      confidence: 0.8,
    };
  }

  return {
    analysis: 'Specify two entities to compare. Examples: "Compare India vs China", "Compare MQ-9 vs Pantsir-S1".',
    recommendation: 'Use the Comparison Tool or Threat Matchup page for detailed analysis.',
    confidence: 0.2,
  };
}

// ─── MAIN HANDLER ────────────────────────────────────────────
async function answerAiQuery({ query, previousQuery = '' }) {
  const trimmedQuery = String(query || '').trim();
  if (!trimmedQuery) {
    return {
      analysis: 'Enter a drone intelligence question to begin analysis.',
      recommendation: 'Try: "Best counter for MQ-9 Reaper", "Compare India vs China", "Which drone is hardest to detect?"',
      confidence: 0.05,
      suggestions: ['Best counter for swarm drones', 'Tell me about MQ-9 Reaper', 'Compare India vs China'],
      source: SOURCE_LABEL,
    };
  }

  const intent = classifyIntent(trimmedQuery);
  const entities = await extractEntities(trimmedQuery);

  let result;
  switch (intent) {
    case 'recommend':
      result = await toolRecommend(entities, trimmedQuery);
      break;
    case 'lookup':
      result = await toolLookup(entities, trimmedQuery);
      break;
    case 'threat':
      result = await toolThreat(entities, trimmedQuery);
      break;
    case 'compare':
      result = await toolCompare(entities, trimmedQuery);
      break;
    case 'tactical':
      result = toolTactical(trimmedQuery);
      break;
    case 'counter_systems':
      result = await toolCounterSystems(entities, trimmedQuery);
      break;
    case 'drone_count':
    case 'country':
      result = await toolCountryAnalysis(entities, trimmedQuery, previousQuery);
      break;
    default:
      // General: try drone lookup first, then country, then fallback
      if (entities.drone) {
        result = await toolLookup(entities, trimmedQuery);
      } else if (entities.matchedCountries.length > 0) {
        result = await toolCountryAnalysis(entities, trimmedQuery, previousQuery);
      } else if (entities.closestDrones[0]?.score > 0.15) {
        const names = entities.closestDrones.slice(0, 3).map(c => c.drone.name).join(', ');
        result = {
          analysis: `I found related platforms in the database: ${names}. ${entities.closestDrones[0].drone.name} is a ${entities.closestDrones[0].drone.type} class UAV from ${entities.closestDrones[0].drone.country}.`,
          recommendation: `For detailed specs, ask: "Tell me about ${entities.closestDrones[0].drone.name}"`,
          confidence: computeConfidence({ similarity: entities.closestDrones[0].score, queryQuality: queryQualityScore(trimmedQuery), dataCompleteness: 0.3 }),
        };
      } else {
        result = {
          analysis: `Processing your query. The database contains ${entities.allDrones.length} drone platforms and ${entities.allCounters.length} counter-systems across ${entities.allCountries.length} nations.`,
          recommendation: 'For best results, try specific questions: "Best counter for [drone]?", "Tell me about [system]", "Compare [A] vs [B]", "Which drone is hardest to detect?"',
          confidence: 0.15,
        };
      }
  }

  // Build suggestions
  const suggestions = [];
  if (intent !== 'recommend') suggestions.push('Best counter for swarm drones');
  if (intent !== 'lookup') suggestions.push('Tell me about MQ-9 Reaper');
  if (intent !== 'compare') suggestions.push('Compare India vs China drones');
  if (intent !== 'threat') suggestions.push('Which drone is hardest to detect?');

  return {
    intent,
    query: trimmedQuery,
    ...result,
    // Ensure fields are NEVER empty
    analysis: result.analysis || 'Analysis processing.',
    answer: result.analysis || 'Analysis processing.', // Backward compatibility
    recommendation: result.recommendation || 'No specific recommendation at this confidence level.',
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.3,
    suggestions: suggestions.slice(0, 3),
    source: SOURCE_LABEL,
  };
}

module.exports = { answerAiQuery };
