const { tokenize } = require('./droneTfidfSearch');

/** Intent-specific weights (sum to 1 with pk; without pk columns renormalized). */
const INTENT_WEIGHTS_PK = {
  best_counter: { sim: 0.26, q: 0.13, dc: 0.12, pk: 0.49 },
  simulate: { sim: 0.32, q: 0.17, dc: 0.17, pk: 0.34 },
  compare: { sim: 0.36, q: 0.19, dc: 0.23, pk: 0.22 },
  general: { sim: 0.5, q: 0.28, dc: 0.22, pk: 0 },
};

function weightsForIntent(intent, hasPk) {
  const key = INTENT_WEIGHTS_PK[intent] ? intent : 'general';
  const row = INTENT_WEIGHTS_PK[key];
  if (hasPk && row.pk > 0) {
    return { sim: row.sim, q: row.q, dc: row.dc, pk: row.pk };
  }
  const t = row.sim + row.q + row.dc;
  return { sim: row.sim / t, q: row.q / t, dc: row.dc / t, pk: 0 };
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function round3(x) {
  return Math.round(Math.min(1, Math.max(0, x)) * 1000) / 1000;
}

/**
 * Operational modifiers inferred from free text (retrieval + engagement).
 */
function detectQueryContext(rawQuery) {
  const q = (rawQuery || '').toLowerCase();
  return {
    night:
      /\b(night|nightly|darkness|dusk|nocturnal|midnight|overnight|after dark)\b/.test(q) ||
      q.includes('at night'),
    stealthFocus: /\b(stealth|stealthy|low observable|lolo|vlo|rcs|low signature)\b/.test(q),
    swarm: /\b(swarm|saturation|massed drones|many drones|drone swarm|flood attack)\b/.test(q),
  };
}

function queryQuality(rawQuery) {
  const q = (rawQuery || '').trim();
  if (!q.length) return 0.35;

  const tokens = tokenize(q);
  if (!tokens.length) return 0.4;

  const unique = new Set(tokens).size;
  const diversity = unique / tokens.length;
  const density = Math.min(1, tokens.length / 7);
  const lenFactor = q.length < 4 ? 0.55 : q.length < 12 ? 0.85 : 1;

  const score = 0.15 + 0.45 * density + 0.4 * diversity;
  return Math.min(1, Math.max(0.25, score * lenFactor));
}

function dataCompleteness(drone) {
  const s = drone?.specs || {};
  const checks = [
    s.range_km != null && Number(s.range_km) >= 0,
    s.speed_kmh != null && Number(s.speed_kmh) >= 0,
    s.endurance_hr != null && Number(s.endurance_hr) >= 0,
    s.stealth_level,
    s.payload_kg != null && Number(s.payload_kg) >= 0,
    s.jamming_resistance,
    s.sensor_type,
    s.weapon_range_km != null && Number(s.weapon_range_km) >= 0,
    drone?.description && String(drone.description).trim().length > 8,
  ];
  const hits = checks.filter(Boolean).length;
  return Math.min(1, Math.max(0.35, hits / checks.length));
}

function dynamicTrust(ranked, qQuality) {
  if (!ranked?.length) return 0;
  const s1 = ranked[0].similarity;
  const s2 = ranked[1]?.similarity ?? 0;
  const margin = s1 > 1e-6 ? Math.max(0, (s1 - s2) / s1) : 0;
  const separation = Math.min(1, margin * 2.8);
  const absolute = Math.min(1, s1 * 1.15);
  return Math.min(1, 0.38 * absolute + 0.32 * separation + 0.3 * qQuality);
}

/**
 * Dataset-relative guard: z-score vs full ranked list + margin + trust rescue.
 */
function retrievalGuardRelative(ranked, trust) {
  if (!ranked?.length) {
    return { active: true, reason: 'no ranked results', stats: {} };
  }

  const list = ranked.slice(0, 48);
  const scores = list.map((r) => r.similarity);
  const s0 = scores[0];
  const s1 = scores[1] ?? s0;
  const margin = s0 > 1e-6 ? (s0 - s1) / s0 : 0;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, x) => a + (x - mean) * (x - mean), 0) / scores.length;
  const std = Math.sqrt(variance) || 1e-5;
  const z = (s0 - mean) / std;

  const sorted = [...scores].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  const liftVsMedian = med > 1e-6 ? (s0 - med) / (1 - med + 0.06) : s0;

  let active = false;
  let reason = '';

  if (z < 0.58 && margin < 0.065) {
    active = true;
    reason = 'the head score is not clearly above the corpus distribution (low z-score and tight #1–#2 margin)';
  } else if (liftVsMedian < 0.075 && margin < 0.095) {
    active = true;
    reason = 'the winner sits close to the corpus median — ambiguous ranking';
  }

  if (mean < 0.07 && s0 < 0.11 && margin < 0.12) {
    active = true;
    reason = 'overall lexical scores are compressed — weak discriminability';
  }

  const tr = clamp01(trust);
  if (active && tr > 0.64) {
    active = false;
    reason = '';
  }

  if (!active && tr < 0.17 && margin < 0.045) {
    active = true;
    reason = 'trust collapsed while the top two scores remain nearly tied';
  }

  return {
    active,
    reason,
    stats: {
      z: round3(z),
      mean: round3(mean),
      std: round3(std),
      margin: round3(margin),
      median: round3(med),
      liftVsMedian: round3(liftVsMedian),
    },
  };
}

function combinedConfidence(similarity, qQuality, dComplete, pk, intent) {
  const sim = clamp01(similarity);
  const q = clamp01(qQuality);
  const d = clamp01(dComplete);
  const hasPk = pk != null && Number.isFinite(pk);
  const w = weightsForIntent(intent || 'general', hasPk);
  if (hasPk) {
    const p = clamp01(pk);
    return round3(w.sim * sim + w.q * q + w.dc * d + w.pk * p);
  }
  return round3(w.sim * sim + w.q * q + w.dc * d);
}

function guardedAdvisoryConfidence(similarity, qQuality, dComplete, intent) {
  const base = combinedConfidence(similarity, qQuality, dComplete, null, intent);
  return round3(Math.min(base, 0.38));
}

function overlappingQueryTokens(rawQuery, drone, searchTextBlob) {
  const qt = tokenize(rawQuery);
  const blob = `${drone?.name || ''} ${searchTextBlob || ''}`.toLowerCase();
  const seen = new Set();
  const out = [];
  for (const t of qt) {
    if (blob.includes(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out.slice(0, 8);
}

function marginNote(ranked) {
  if (!ranked?.length) return '';
  const s1 = ranked[0].similarity;
  const s2 = ranked[1]?.similarity ?? 0;
  const m = s1 > 1e-6 ? (s1 - s2) / s1 : 0;
  return `Rank margin vs #2: ${m.toFixed(2)} (higher means a clearer winner).`;
}

function contextEffectsLine(context) {
  if (!context) return '';
  const parts = [];
  if (context.night) {
    parts.push(
      'Night context: retrieval favored IR/thermal/optical cues over pure radar-heavy profiles; engagement slightly de-weights radar sensing and boosts IR/multi-sensor tracks.'
    );
  }
  if (context.stealthFocus) {
    parts.push(
      'Stealth context: engagement applies an extra detection-side penalty against low-observable targets (harder to establish fire control).'
    );
  }
  if (context.swarm) {
    parts.push(
      'Swarm context: engagement scales with defender simultaneous-target capacity (swarm-class threats penalize narrow-channel interceptors).'
    );
  }
  return parts.length ? `Context effects: ${parts.join(' ')}` : '';
}

function explainSelection({
  rawQuery,
  drone,
  searchText,
  ranked,
  retrievalScore,
  bestCounter,
  bestPk,
  trust,
  qQuality,
  dc,
  guard,
  context,
  intent,
}) {
  const lines = [];
  const simShow = retrievalScore ?? ranked[0]?.similarity ?? 0;
  const overlaps = overlappingQueryTokens(rawQuery, drone, searchText);
  lines.push(
    `Why this platform: highest TF–IDF alignment with your query (score ${simShow.toFixed(3)}; trust ${trust.toFixed(
      2
    )}; intent ${intent || 'general'}).`
  );
  if (overlaps.length) {
    lines.push(`Overlapping query terms in the profile: ${overlaps.join(', ')}.`);
  } else {
    lines.push('Few direct token overlaps; match is driven mainly by expanded profile text (type, country, specs).');
  }
  lines.push(`Query clarity ${qQuality.toFixed(2)}; record completeness for this drone ${dc.toFixed(2)}.`);
  lines.push(marginNote(ranked));

  if (guard && guard.stats && Object.keys(guard.stats).length) {
    lines.push(
      `Corpus-relative check: z≈${guard.stats.z} (vs ranked list), margin=${guard.stats.margin}, median lift≈${guard.stats.liftVsMedian}.`
    );
  }

  if (guard && guard.active) {
    lines.push(
      `Guard: ${guard.reason} — counter advice is withheld to avoid a misleading pick; review the candidate list instead.`
    );
  } else if (bestCounter && bestPk != null) {
    lines.push(
      `Why this counter: among ${bestCounter.effectiveness || 'rated'} systems in the catalog, ${bestCounter.name} yields the highest modeled Pk (${bestPk.toFixed(
        3
      )}) against ${drone.name}'s stealth/speed profile (detection × tracking × intercept), including any query context modifiers.`
    );
  }

  const ctxLine = contextEffectsLine(context);
  if (ctxLine) lines.push(ctxLine);

  if (ranked.length > 1) {
    lines.push(`Next closest platforms: ${ranked.slice(1, 4).map((r) => r.drone.name).join(', ')}.`);
  }

  return lines.join(' ');
}

module.exports = {
  detectQueryContext,
  queryQuality,
  dataCompleteness,
  dynamicTrust,
  combinedConfidence,
  guardedAdvisoryConfidence,
  retrievalGuardRelative,
  explainSelection,
};
