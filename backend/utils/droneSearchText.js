const COUNTRY_SYNONYMS = {
  USA: 'usa united states america us american',
  US: 'usa united states america us american',
  'United States': 'usa united states america us american',
  CHN: 'china chinese prc',
  China: 'china chinese prc',
  RUS: 'russia russian federation',
  Russia: 'russia russian federation',
  IND: 'india indian',
  India: 'india indian',
  ISR: 'israel israeli',
  Israel: 'israel israeli',
  UKR: 'ukraine ukrainian',
  Ukraine: 'ukraine ukrainian',
  TUR: 'turkey turkish',
  Turkey: 'turkey turkish',
};

const TYPE_SYNONYMS = {
  Nano: 'nano micro miniature pocket reconnaissance close range indoor small',
  Tactical: 'tactical battlefield attack strike medium altitude armed combat',
  MALE: 'male medium altitude endurance attack armed strike combat predator class',
  HALE: 'hale high altitude long endurance strategic isr surveillance global hawk class',
  Loitering: 'loitering munition kamikaze suicide one way attack cruise',
  Swarm: 'swarm coordinated saturation flood many drones group attack',
};

/**
 * Builds a single searchable string per drone (used for TF–IDF corpus).
 * Attached as `searchText` on in-memory copies (no DB migration required).
 */
function buildDroneSearchText(drone) {
  const s = drone?.specs || {};
  const countryExtra = COUNTRY_SYNONYMS[drone?.country] || '';
  const typeExtra = TYPE_SYNONYMS[drone?.type] || '';

  const parts = [
    drone?.name,
    drone?.type,
    typeExtra,
    drone?.country,
    countryExtra,
    drone?.description,
    s.range_km != null && `range ${s.range_km} km`,
    s.endurance_hr != null && `endurance ${s.endurance_hr} hours`,
    s.speed_kmh != null && `speed ${s.speed_kmh} kmh`,
    s.payload_kg != null && `payload ${s.payload_kg} kg`,
    s.stealth_level && `stealth ${s.stealth_level}`,
    s.jamming_resistance && `jamming resistance ${s.jamming_resistance}`,
    s.sensor_type && `sensor ${s.sensor_type}`,
    s.weapon_range_km != null && `weapon range ${s.weapon_range_km} km`,
    s.detection_range_km != null && `detection range ${s.detection_range_km} km`,
    s.price_usd != null && `price usd ${s.price_usd}`,
  ];

  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { buildDroneSearchText };
