const Country = require('../models/Country');
const Drone = require('../models/Drone');
const CounterSystem = require('../models/CounterSystem');

const SOURCE_LABEL = 'Internal database + defense reports';

function normalizeText(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function resolveIntent(query, previousQuery = '') {
  const normalizedQuery = normalizeText(query);
  const normalizedPreviousQuery = normalizeText(previousQuery);
  const combined = `${normalizedQuery} ${normalizedPreviousQuery}`.trim();

  if (includesAny(normalizedQuery, ['compare', ' vs ', ' versus ', 'against'])) {
    return 'comparison';
  }

  if (includesAny(normalizedQuery, ['counter', 'defense', 'defence', 'swarm', 'jam', 'laser'])) {
    return 'counter_systems';
  }

  if (includesAny(normalizedQuery, ['count', 'how many', 'fleet', 'inventory', 'drones does'])) {
    return 'drone_count';
  }

  if (
    includesAny(normalizedQuery, ['what about', 'and ', 'same for', 'compare with']) &&
    includesAny(normalizedPreviousQuery, ['count', 'how many', 'fleet', 'inventory'])
  ) {
    return 'drone_count';
  }

  if (includesAny(combined, ['compare', ' vs ', ' versus '])) {
    return 'comparison';
  }

  return 'country_analysis';
}

function countryAliases(country) {
  const aliases = [country.name, country.code];

  if (country.code === 'USA') aliases.push('us', 'u s', 'america', 'american', 'united states');
  if (country.code === 'CHN') aliases.push('china', 'chinese');
  if (country.code === 'IND') aliases.push('india', 'indian');
  if (country.code === 'RUS') aliases.push('russia', 'russian');
  if (country.code === 'ISR') aliases.push('israel', 'israeli');

  return aliases.map(normalizeText);
}

function findCountriesInText(text, countries) {
  const normalized = normalizeText(text);

  return countries.filter((country) =>
    countryAliases(country).some((alias) => normalized.includes(alias))
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function topDroneNames(drones) {
  return drones.length
    ? drones.slice(0, 3).map((drone) => drone.name).join(', ')
    : 'no matching platforms in the current registry';
}

function buildSuggestions(intent, countries) {
  const firstCountry = countries[0]?.name || 'India';
  const secondCountry = countries[1]?.name || 'China';

  if (intent === 'comparison') {
    return [
      `What are ${firstCountry}'s top drone platforms?`,
      'Show counter systems for swarm drones',
    ];
  }

  if (intent === 'counter_systems') {
    return [
      'Compare India vs China drones',
      `What is the drone count for ${firstCountry}?`,
    ];
  }

  return [
    'Compare India vs China drones',
    'Show counter systems for swarm drones',
  ];
}

async function buildDroneCountAnswer(query, previousQuery, countries) {
  const matchedCountries = findCountriesInText(query, countries);
  const contextualCountries = matchedCountries.length
    ? matchedCountries
    : findCountriesInText(previousQuery, countries);
  const country = contextualCountries[0] || countries[0];

  if (!country) {
    return {
      answer: 'I could not find a country match in the current drone intelligence database.',
      confidence: 'Low',
      source: SOURCE_LABEL,
      suggestions: buildSuggestions('drone_count', []),
    };
  }

  const drones = await Drone.find({ country: { $regex: new RegExp(`^${country.name}$|^${country.code}$`, 'i') } })
    .sort({ 'specs.range_km': -1 })
    .lean();

  return {
    answer: `${country.name} has approximately ${formatNumber(country.drone_count)} drones in the internal registry. Its current specialization is ${country.specialization}, with a reported growth trajectory of ${country.growth_rate}% year over year. Notable platforms include ${country.top_drones?.join(', ') || topDroneNames(drones)}.`,
    confidence: 'High',
    source: SOURCE_LABEL,
    suggestions: buildSuggestions('drone_count', [country]),
  };
}

async function buildComparisonAnswer(query, previousQuery, countries) {
  const matchedCountries = findCountriesInText(`${query} ${previousQuery}`, countries).slice(0, 2);

  if (matchedCountries.length < 2) {
    const topCountries = countries.slice(0, 2);
    return {
      answer: `I need two countries to run a clean comparison. Based on the current leaders, ${topCountries[0]?.name || 'the first country'} fields ${formatNumber(topCountries[0]?.drone_count)} drones while ${topCountries[1]?.name || 'the second country'} fields ${formatNumber(topCountries[1]?.drone_count)} drones.`,
      confidence: 'Medium',
      source: SOURCE_LABEL,
      suggestions: buildSuggestions('comparison', topCountries),
    };
  }

  const [left, right] = matchedCountries;
  const leftDrones = await Drone.find({ country: { $regex: new RegExp(`^${left.name}$|^${left.code}$`, 'i') } }).lean();
  const rightDrones = await Drone.find({ country: { $regex: new RegExp(`^${right.name}$|^${right.code}$`, 'i') } }).lean();
  const fleetGap = Math.abs((left.drone_count || 0) - (right.drone_count || 0));
  const leader = left.drone_count >= right.drone_count ? left : right;

  return {
    answer: `${left.name} vs ${right.name}: ${left.name} fields approximately ${formatNumber(left.drone_count)} drones with a ${left.specialization} focus, while ${right.name} fields approximately ${formatNumber(right.drone_count)} drones with a ${right.specialization} focus. ${leader.name} leads by roughly ${formatNumber(fleetGap)} drones. ${left.name}'s notable platforms include ${topDroneNames(leftDrones)}; ${right.name}'s notable platforms include ${topDroneNames(rightDrones)}.`,
    confidence: 'High',
    source: SOURCE_LABEL,
    suggestions: buildSuggestions('comparison', [left, right]),
  };
}

async function buildCounterSystemsAnswer(query) {
  const normalized = normalizeText(query);
  const threatTypes = ['Swarm', 'Nano', 'Tactical', 'MALE', 'HALE', 'Loitering'];
  const matchedThreat = threatTypes.find((type) => normalized.includes(type.toLowerCase())) || 'Swarm';
  const counters = await CounterSystem.find({ effective_against: matchedThreat }).sort({ effectiveness: 1 }).lean();

  if (!counters.length) {
    return {
      answer: `No counter systems are currently mapped to ${matchedThreat} threats in the internal database.`,
      confidence: 'Medium',
      source: SOURCE_LABEL,
      suggestions: buildSuggestions('counter_systems', []),
    };
  }

  const counterSummary = counters
    .slice(0, 3)
    .map((counter) => `${counter.name} (${counter.type}, ${counter.effectiveness} effectiveness, ${counter.range_km} km range)`)
    .join('; ');

  return {
    answer: `For ${matchedThreat} drone activity, the strongest mapped counter systems are ${counterSummary}. These systems are prioritized because their effective-against profiles match the threat class and their defensive roles cover layered detection, disruption, or defeat.`,
    confidence: counters.length >= 2 ? 'High' : 'Medium',
    source: SOURCE_LABEL,
    suggestions: buildSuggestions('counter_systems', []),
  };
}

async function buildCountryAnalysisAnswer(query, previousQuery, countries) {
  const matchedCountries = findCountriesInText(query, countries);
  const contextualCountries = matchedCountries.length
    ? matchedCountries
    : findCountriesInText(previousQuery, countries);
  const country = contextualCountries[0] || countries[0];

  if (!country) {
    return {
      answer: 'I could not identify a country to analyze. Try asking about India, China, the United States, Russia, or Israel.',
      confidence: 'Low',
      source: SOURCE_LABEL,
      suggestions: buildSuggestions('country_analysis', []),
    };
  }

  const drones = await Drone.find({ country: { $regex: new RegExp(`^${country.name}$|^${country.code}$`, 'i') } }).lean();
  const dominantTypes = [...new Set(drones.map((drone) => drone.type))].slice(0, 3).join(', ') || country.specialization;

  return {
    answer: `${country.name} is assessed as a ${country.specialization} drone power with approximately ${formatNumber(country.drone_count)} drones and ${country.growth_rate}% year-over-year growth. The database indicates emphasis on ${dominantTypes}, with known platforms including ${country.top_drones?.join(', ') || topDroneNames(drones)}. The posture suggests a mix of operational scale and specialization rather than a single-platform dependency.`,
    confidence: 'High',
    source: SOURCE_LABEL,
    suggestions: buildSuggestions('country_analysis', [country]),
  };
}

async function answerAiQuery({ query, previousQuery = '' }) {
  const trimmedQuery = String(query || '').trim();

  if (!trimmedQuery) {
    return {
      answer: 'Enter a drone intelligence question to begin analysis.',
      confidence: 'Low',
      source: SOURCE_LABEL,
      suggestions: buildSuggestions('country_analysis', []),
    };
  }

  const countries = await Country.find().sort({ drone_count: -1 }).lean();
  const intent = resolveIntent(trimmedQuery, previousQuery);
  let response;

  if (intent === 'comparison') {
    response = await buildComparisonAnswer(trimmedQuery, previousQuery, countries);
  } else if (intent === 'counter_systems') {
    response = await buildCounterSystemsAnswer(trimmedQuery);
  } else if (intent === 'drone_count') {
    response = await buildDroneCountAnswer(trimmedQuery, previousQuery, countries);
  } else {
    response = await buildCountryAnalysisAnswer(trimmedQuery, previousQuery, countries);
  }

  return {
    intent,
    query: trimmedQuery,
    ...response,
  };
}

module.exports = {
  answerAiQuery,
};
