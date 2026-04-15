const Update = require('../models/Update');
const { broadcastUpdate } = require('../utils/updateStream');

const DRONE_QUERY = '("drone" OR "uav" OR "counter-drone" OR "drone swarm" OR "loitering munition")';
const GOOGLE_NEWS_RSS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(DRONE_QUERY)}&hl=en-US&gl=US&ceid=US:en`;
const NEWS_REFRESH_INTERVAL_MS = Number(process.env.NEWS_REFRESH_INTERVAL_MS || 120000);
const COUNTRY_KEYWORDS = {
  USA: ['united states', 'u.s.', 'us ', 'u.s. ', 'american'],
  CHN: ['china', 'chinese'],
  RUS: ['russia', 'russian'],
  IND: ['india', 'indian'],
  ISR: ['israel', 'israeli'],
  UKR: ['ukraine', 'ukrainian'],
  GBR: ['britain', 'british', 'uk '],
  IRN: ['iran', 'iranian'],
  TUR: ['turkey', 'turkish'],
};

let serviceStarted = false;

function decodeHtml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

function stripTags(value = '') {
  return decodeHtml(value).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function extractTagValue(itemXml, tagName) {
  const match = itemXml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? stripTags(match[1]) : '';
}

function extractSource(itemXml) {
  const sourceMatch = itemXml.match(/<source(?:\s+url="([^"]*)")?>([\s\S]*?)<\/source>/i);

  if (!sourceMatch) {
    return { source: '', sourceUrl: '' };
  }

  return {
    source: stripTags(sourceMatch[2]),
    sourceUrl: decodeHtml(sourceMatch[1] || ''),
  };
}

function extractItemsFromRss(xml) {
  const matches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return matches.map((itemXml) => {
    const { source, sourceUrl } = extractSource(itemXml);
    return {
      title: extractTagValue(itemXml, 'title'),
      link: extractTagValue(itemXml, 'link'),
      externalId: extractTagValue(itemXml, 'guid') || extractTagValue(itemXml, 'link'),
      publishedAt: extractTagValue(itemXml, 'pubDate'),
      description: extractTagValue(itemXml, 'description'),
      source,
      sourceUrl,
      provider: 'google-news-rss',
    };
  });
}

function resolveSeverityFromText(text) {
  const normalizedText = text.toLowerCase();

  if (/(attack|strike|war|missile|combat|killed|warning|loss)/.test(normalizedText)) {
    return 'High';
  }

  if (/(test|trial|drill|exercise|prototype|demo|rehears)/.test(normalizedText)) {
    return 'Medium';
  }

  if (/(launch|unveil|funding|deal|contract|package|delivery|acquire|expands)/.test(normalizedText)) {
    return 'Low';
  }

  return 'Medium';
}

function resolveCategoryFromText(text) {
  const normalizedText = text.toLowerCase();

  if (/(counter-drone|laser|jamming|shield|defense)/.test(normalizedText)) {
    return 'Counter-UAS';
  }

  if (/(swarm|massive|coordinated)/.test(normalizedText)) {
    return 'Swarm Activity';
  }

  if (/(test|trial|drill|exercise|prototype|demo)/.test(normalizedText)) {
    return 'Testing & Trials';
  }

  if (/(deal|contract|package|funding|acquire)/.test(normalizedText)) {
    return 'Industry & Procurement';
  }

  if (/(launch|flight|sortie|deploy)/.test(normalizedText)) {
    return 'Launch & Deployment';
  }

  return 'Drone Intelligence';
}

function resolveCountryFromText(text) {
  const normalizedText = text.toLowerCase();

  for (const [countryCode, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedText.includes(keyword))) {
      return countryCode;
    }
  }

  return 'GLOBAL';
}

function buildSummary(article) {
  const text = `${article.title} ${article.description || ''}`;
  const normalizedText = text.toLowerCase();

  if (/(attack|strike|combat|warning|loss)/.test(normalizedText)) {
    return 'Recent reporting points to heightened operational risk and more immediate military significance in the drone domain.';
  }

  if (/(test|trial|drill|exercise|prototype|demo)/.test(normalizedText)) {
    return 'Recent reporting suggests capability validation or readiness improvement rather than direct battlefield escalation.';
  }

  if (/(deal|contract|funding|acquire|package)/.test(normalizedText)) {
    return 'Recent reporting indicates procurement or investment momentum that can strengthen future drone capability.';
  }

  if (/(launch|deploy|flight|sortie)/.test(normalizedText)) {
    return 'Recent reporting highlights active deployment or expansion of operational drone reach.';
  }

  return 'Recent reporting shows notable movement in drone technology, operations, or policy relevant to the monitoring feed.';
}

async function fetchFromNewsApi() {
  if (!process.env.NEWS_API_KEY) {
    return [];
  }

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', 'drone OR UAV OR "counter-drone" OR "drone swarm"');
  url.searchParams.set('language', 'en');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('pageSize', '20');

  const response = await fetch(url, {
    headers: {
      'X-Api-Key': process.env.NEWS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`NewsAPI request failed with ${response.status}.`);
  }

  const data = await response.json();

  return (data.articles || []).map((article) => ({
    title: article.title || '',
    link: article.url || '',
    externalId: article.url || article.title || '',
    publishedAt: article.publishedAt,
    description: article.description || article.content || '',
    source: article.source?.name || 'NewsAPI',
    sourceUrl: '',
    provider: 'newsapi',
  }));
}

async function fetchFromGNews() {
  if (!process.env.GNEWS_API_KEY) {
    return [];
  }

  const url = new URL('https://gnews.io/api/v4/search');
  url.searchParams.set('q', 'drone OR UAV OR "counter-drone" OR "drone swarm"');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('max', '20');
  url.searchParams.set('apikey', process.env.GNEWS_API_KEY);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GNews request failed with ${response.status}.`);
  }

  const data = await response.json();

  return (data.articles || []).map((article) => ({
    title: article.title || '',
    link: article.url || '',
    externalId: article.url || article.title || '',
    publishedAt: article.publishedAt,
    description: article.description || article.content || '',
    source: article.source?.name || 'GNews',
    sourceUrl: article.source?.url || '',
    provider: 'gnews',
  }));
}

async function fetchFromGoogleNewsRss() {
  const response = await fetch(GOOGLE_NEWS_RSS_URL, {
    headers: {
      'User-Agent': 'DroneScope-AI/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Google News RSS request failed with ${response.status}.`);
  }

  const xml = await response.text();
  return extractItemsFromRss(xml);
}

async function fetchLiveArticles() {
  try {
    const articles = await fetchFromNewsApi();
    if (articles.length) {
      return articles;
    }
  } catch (error) {
    console.error('NewsAPI fetch failed:', error.message);
  }

  try {
    const articles = await fetchFromGNews();
    if (articles.length) {
      return articles;
    }
  } catch (error) {
    console.error('GNews fetch failed:', error.message);
  }

  return fetchFromGoogleNewsRss();
}

function normalizeArticleToUpdate(article) {
  const combinedText = `${article.title} ${article.description || ''}`;
  const country = resolveCountryFromText(combinedText);

  return {
    title: article.title.trim(),
    source: article.source || 'Live News Feed',
    summary: buildSummary(article),
    timestamp: article.publishedAt ? new Date(article.publishedAt) : new Date(),
    severity: resolveSeverityFromText(combinedText),
    country,
    category: resolveCategoryFromText(combinedText),
    link: article.link || article.sourceUrl || '',
    external_id: article.externalId || article.link || article.title,
    provider: article.provider || 'live-news',
    ingested_at: new Date(),
  };
}

async function cleanupLegacySimulatedUpdates() {
  await Update.deleteMany({ provider: { $in: ['', null] } });
}

async function trimOldUpdates() {
  const staleUpdates = await Update.find().sort({ timestamp: -1 }).skip(120);

  if (staleUpdates.length) {
    await Update.deleteMany({ _id: { $in: staleUpdates.map((item) => item._id) } });
  }
}

async function ingestLatestNews() {
  const articles = await fetchLiveArticles();
  const normalizedArticles = articles
    .map(normalizeArticleToUpdate)
    .filter((article) => article.title && article.external_id);

  const existingIds = new Set(
    (
      await Update.find({ external_id: { $in: normalizedArticles.map((item) => item.external_id) } })
        .select('external_id')
        .lean()
    ).map((item) => item.external_id)
  );

  const freshArticles = normalizedArticles.filter((article) => !existingIds.has(article.external_id));

  for (const article of freshArticles) {
    const created = await Update.create(article);
    broadcastUpdate(created);
  }

  await trimOldUpdates();
}

function scheduleNextIngestion() {
  setTimeout(async () => {
    try {
      await ingestLatestNews();
    } catch (error) {
      console.error('Failed to ingest live drone news:', error);
    } finally {
      scheduleNextIngestion();
    }
  }, NEWS_REFRESH_INTERVAL_MS).unref();
}

async function startLiveNewsUpdates() {
  if (serviceStarted) {
    return;
  }

  serviceStarted = true;
  await cleanupLegacySimulatedUpdates();
  await ingestLatestNews();
  scheduleNextIngestion();
}

module.exports = {
  startLiveNewsUpdates,
};
