const Drone = require('../models/Drone');
const CounterSystem = require('../models/CounterSystem');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Intent detection only. Drone resolution uses TF–IDF (`rankDronesByQuery`).
 * @param {string} raw
 * @returns {{ intent: string }}
 */
function parseAiQuery(raw) {
  const q = raw.toLowerCase().trim();

  let intent = 'general';
  if (
    q.includes('best counter') ||
    q.includes('counter for') ||
    q.includes('counter against') ||
    q.includes('counter to') ||
    q.includes('what stops') ||
    q.includes('defend against')
  ) {
    intent = 'best_counter';
  } else if (q.includes('simulate') || q.includes('simulation')) {
    intent = 'simulate';
  } else if (q.includes('compare') || q.includes(' vs ') || q.includes(' versus ')) {
    intent = 'compare';
  }

  return { intent };
}

async function getDroneNames() {
  const rows = await Drone.find({}, 'name').lean();
  return rows.map((r) => r.name);
}

async function getDroneByName(name) {
  if (!name || !String(name).trim()) return null;

  const trimmed = String(name).trim();
  let doc = await Drone.findOne({
    name: new RegExp(`^${escapeRegex(trimmed)}$`, 'i'),
  }).lean();
  if (doc) return doc;

  doc = await Drone.findOne({
    name: new RegExp(escapeRegex(trimmed), 'i'),
  }).lean();
  return doc;
}

async function getAllCounterSystems() {
  return CounterSystem.find({}).lean();
}

module.exports = {
  parseAiQuery,
  getDroneByName,
  getDroneNames,
  getAllCounterSystems,
};
