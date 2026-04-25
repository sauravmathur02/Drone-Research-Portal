const Drone = require('../models/Drone');
const { buildDroneSearchText } = require('./droneSearchText');

const TTL_MS = 5 * 60 * 1000;

const STOPWORDS = new Set(
  `a an the and or for to of in on at by from with as is are was were be been being
   this that these those it its if then than into over under out about between
   drone drones uav uavs vehicle aircraft platform
   best counter compare simulation versus vs what which how show tell me give`.split(/\s+/)
);

/** @type {{ builtAt: number, droneCount: number, vocab: string[], idf: Float64Array, entries: Array<{ drone: object, searchText: string, weights: Map<number, number>, norm: number }> } | null} */
let indexCache = null;

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Base query-side boosts for capability-related tokens. */
const FEATURE_QUERY_BOOST = new Map(
  Object.entries({
    range: 1.5,
    stealth: 1.55,
    speed: 1.48,
    kmh: 1.22,
    endurance: 1.28,
    payload: 1.22,
    sensor: 1.18,
    jamming: 1.26,
    weapon: 1.2,
    detection: 1.18,
    altitude: 1.2,
    attack: 1.12,
    strike: 1.12,
    reconnaissance: 1.12,
    isr: 1.12,
    loitering: 1.15,
    swarm: 1.15,
    tactical: 1.12,
    high: 1.08,
    medium: 1.06,
    low: 1.06,
  })
);

/** Token → semantic cluster for adaptive co-occurrence scaling. */
const TERM_CLUSTER = {
  range: 'space',
  endurance: 'space',
  altitude: 'space',
  speed: 'mob',
  kmh: 'mob',
  stealth: 'sig',
  jamming: 'sig',
  sensor: 'sig',
  detection: 'sig',
  payload: 'strike',
  weapon: 'strike',
  attack: 'strike',
  strike: 'strike',
  loitering: 'role',
  swarm: 'role',
  tactical: 'role',
  reconnaissance: 'role',
  isr: 'role',
};

/**
 * Adaptive per-token boost: strengthens features the user actually emphasized.
 * Cluster amplification is capped to avoid over-boosting redundant tokens.
 */
function adaptiveTermBoosts(queryText) {
  const tokens = tokenize(queryText);
  const clusterCounts = new Map();
  for (const t of tokens) {
    const c = TERM_CLUSTER[t];
    if (!c) continue;
    clusterCounts.set(c, (clusterCounts.get(c) || 0) + 1);
  }

  const out = new Map();
  for (const t of tokens) {
    const base = FEATURE_QUERY_BOOST.get(t) || 1;
    const cluster = TERM_CLUSTER[t];
    if (!cluster) {
      out.set(t, base);
      continue;
    }
    const n = clusterCounts.get(cluster) || 1;
    const mult = 1 + Math.min(0.11, (n - 1) * 0.042);
    out.set(t, Math.min(1.48, base * mult));
  }
  return out;
}

/**
 * Small retrieval deltas from operational context (keeps TF–IDF as base).
 * @param {object} context { night, stealthFocus, swarm }
 */
function retrievalContextDelta(searchText, drone, context) {
  if (!context) return 0;
  const st = (searchText || '').toLowerCase();
  let d = 0;

  if (context.night) {
    if (/\bir\b|thermal|optical|eo|infrared|night\s*vision/.test(st)) d += 0.017;
    if (st.includes('radar') && !st.includes('multi')) d -= 0.011;
  }

  if (context.stealthFocus) {
    const lvl = drone?.specs?.stealth_level;
    if (lvl === 'High') d += 0.014;
    else if (lvl === 'Medium') d += 0.007;
  }

  if (context.swarm) {
    if (st.includes('swarm')) d += 0.018;
    if (drone?.type === 'Swarm') d += 0.01;
  }

  return d;
}

function termFrequencyMap(tokens) {
  const m = new Map();
  let maxC = 1;
  for (const t of tokens) {
    const c = (m.get(t) || 0) + 1;
    m.set(t, c);
    if (c > maxC) maxC = c;
  }
  return { map: m, maxC };
}

function buildIndex(drones) {
  const N = drones.length;
  const docs = drones.map((d) => {
    const searchText = buildDroneSearchText(d);
    const tokens = tokenize(searchText);
    return { drone: d, searchText, tokens };
  });

  const docFreq = new Map();
  for (const { tokens } of docs) {
    const seen = new Set(tokens);
    for (const t of seen) {
      docFreq.set(t, (docFreq.get(t) || 0) + 1);
    }
  }

  const vocab = Array.from(docFreq.keys()).sort();
  const termToIndex = new Map(vocab.map((t, i) => [t, i]));
  const idf = new Float64Array(vocab.length);
  for (let i = 0; i < vocab.length; i++) {
    const df = docFreq.get(vocab[i]) || 1;
    idf[i] = Math.log((1 + N) / (1 + df)) + 1;
  }

  const entries = docs.map(({ drone, searchText, tokens }) => {
    const { map: tfMap, maxC } = termFrequencyMap(tokens);
    const weights = new Map();
    for (const [term, c] of tfMap) {
      const idx = termToIndex.get(term);
      if (idx === undefined) continue;
      const tf = 0.5 + 0.5 * (c / maxC);
      const w = tf * idf[idx];
      weights.set(idx, w);
    }
    let norm = 0;
    for (const w of weights.values()) norm += w * w;
    norm = Math.sqrt(norm) || 1e-9;
    return { drone, searchText, weights, norm };
  });

  return { builtAt: Date.now(), droneCount: N, vocab, idf, termToIndex, entries };
}

function queryVector(queryText, termToIndex, idf, useFeatureBoost = true) {
  const tokens = tokenize(queryText);
  if (!tokens.length) return { weights: new Map(), norm: 1e-9 };

  const adaptive = useFeatureBoost ? adaptiveTermBoosts(queryText) : null;
  const { map: tfMap, maxC } = termFrequencyMap(tokens);
  const weights = new Map();
  for (const [term, c] of tfMap) {
    const idx = termToIndex.get(term);
    if (idx === undefined) continue;
    const tf = 0.5 + 0.5 * (c / maxC);
    const boost = useFeatureBoost ? adaptive.get(term) || FEATURE_QUERY_BOOST.get(term) || 1 : 1;
    const w = tf * idf[idx] * boost;
    weights.set(idx, w);
  }
  let norm = 0;
  for (const w of weights.values()) norm += w * w;
  norm = Math.sqrt(norm) || 1e-9;
  return { weights, norm };
}

function cosineSimilarity(qWeights, qNorm, dWeights, dNorm) {
  if (qNorm < 1e-12 || dNorm < 1e-12) return 0;
  let dot = 0;
  if (qWeights.size <= dWeights.size) {
    for (const [i, qw] of qWeights) {
      const dw = dWeights.get(i);
      if (dw !== undefined) dot += qw * dw;
    }
  } else {
    for (const [i, dw] of dWeights) {
      const qw = qWeights.get(i);
      if (qw !== undefined) dot += qw * dw;
    }
  }
  return dot / (qNorm * dNorm);
}

function nameOverlapBoost(queryText, drone) {
  const qTokens = new Set(tokenize(queryText));
  const nTokens = new Set(tokenize(drone?.name || ''));
  if (!qTokens.size || !nTokens.size) return 0;
  let hit = 0;
  for (const t of qTokens) {
    if (nTokens.has(t)) hit += 1;
  }
  return Math.min(0.12, hit * 0.035);
}

async function ensureIndex() {
  const drones = await Drone.find({}).lean();
  const count = drones.length;
  const now = Date.now();

  if (
    indexCache &&
    now - indexCache.builtAt < TTL_MS &&
    indexCache.droneCount === count
  ) {
    return indexCache;
  }

  if (!count) {
    indexCache = {
      builtAt: now,
      droneCount: 0,
      vocab: [],
      idf: new Float64Array(0),
      termToIndex: new Map(),
      entries: [],
    };
    return indexCache;
  }

  indexCache = buildIndex(drones);
  return indexCache;
}

/**
 * Rank all drones by TF–IDF cosine similarity to the user query (cached index).
 * @param {string} userQuery
 * @param {{ context?: { night?: boolean, stealthFocus?: boolean, swarm?: boolean } }} [options]
 * @returns {Promise<{ ranked: Array<{ drone: object, similarity: number, searchText: string }> }>}
 */
async function rankDronesByQuery(userQuery, options = {}) {
  const context = options.context || null;
  const idx = await ensureIndex();
  if (!idx.entries.length) {
    return { ranked: [] };
  }

  const { weights: qW, norm: qN } = queryVector(userQuery, idx.termToIndex, idx.idf, true);

  const ranked = idx.entries.map(({ drone, searchText, weights, norm }) => {
    let sim = cosineSimilarity(qW, qN, weights, norm);
    sim += nameOverlapBoost(userQuery, drone);
    sim += retrievalContextDelta(searchText, drone, context);
    sim = Math.min(1, Math.max(0, sim));
    return { drone, similarity: sim, searchText };
  });

  ranked.sort((a, b) => b.similarity - a.similarity);
  return { ranked };
}

function invalidateDroneSearchIndex() {
  indexCache = null;
}

module.exports = {
  rankDronesByQuery,
  ensureIndex,
  invalidateDroneSearchIndex,
  tokenize,
};
