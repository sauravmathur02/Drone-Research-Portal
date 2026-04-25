/**
 * In-memory per-user conversation context (last 5 user queries).
 * No database — bounded Map, safe for single-node deployments.
 */

const MAX_QUERIES = 5;
const MAX_USERS = 20000;

/** @type {Map<string, { queries: string[] }>} */
const store = new Map();

function getUserId(req) {
  const raw = req.headers['x-user-id'] || req.headers['X-User-Id'];
  const s = raw != null ? String(raw).trim() : '';
  if (!s) return 'anonymous';
  return s.slice(0, 128);
}

/**
 * Combine recent user queries with the current one for retrieval (TF–IDF).
 * Uses up to the last 4 stored queries + current (max 5 segments).
 */
function buildContextualQuery(userId, currentQuery) {
  const q = String(currentQuery || '').trim();
  if (!q) return q;

  const bucket = store.get(userId);
  if (!bucket?.queries?.length) return q;

  const prev = bucket.queries.slice(-4);
  return [...prev, q].join('\n---\n');
}

/**
 * Append this user query to rolling memory after a successful response.
 */
function recordAfterTurn(userId, userQuery) {
  const q = String(userQuery || '').trim();
  if (!q) return;

  if (!store.has(userId) && store.size >= MAX_USERS) {
    const firstKey = store.keys().next().value;
    store.delete(firstKey);
  }

  const bucket = store.get(userId) || { queries: [] };
  bucket.queries.push(q);
  if (bucket.queries.length > MAX_QUERIES) {
    bucket.queries = bucket.queries.slice(-MAX_QUERIES);
  }
  store.set(userId, bucket);
}

function respondWithMemory(userId, userQuery, res, body) {
  recordAfterTurn(userId, userQuery);
  return res.json(body);
}

module.exports = {
  getUserId,
  buildContextualQuery,
  recordAfterTurn,
  respondWithMemory,
};
