const Parser = require('rss-parser');
const axios = require('axios');
const cron = require('node-cron');
const Drone = require('../models/Drone');
const Update = require('../models/Update');
const aiService = require('./aiService');
const updateStream = require('../utils/updateStream');

const parser = new Parser({ timeout: 10000 });

const DRONE_RSS_FEEDS = [
  'https://dronedj.com/feed/',
  'https://www.unmannedairspace.info/feed/',
  'https://dronelife.com/feed/'
];

class AutomatedDroneDiscoveryService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * 1. Syncs existing & newly cataloged drones from Wikidata SPARQL endpoint (Class: Q484000 UAV)
   */
  async syncFromWikidata(limit = 50) {
    const sparqlQuery = `
      SELECT ?uav ?uavLabel ?uavDescription ?countryLabel ?manufacturerLabel ?inception ?mass ?wingspan WHERE {
        ?uav wdt:P31/wdt:P279* wd:Q484000.
        OPTIONAL { ?uav wdt:P495 ?country. }
        OPTIONAL { ?uav wdt:P176 ?manufacturer. }
        OPTIONAL { ?uav wdt:P571 ?inception. }
        OPTIONAL { ?uav wdt:P2067 ?mass. }
        OPTIONAL { ?uav wdt:P2050 ?wingspan. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT ${limit}
    `;

    try {
      const response = await axios.get('https://query.wikidata.org/sparql', {
        params: { query: sparqlQuery, format: 'json' },
        headers: { 'User-Agent': 'DroneResearchPortal/2.0 (Academic Research Project)' },
        timeout: 15000
      });

      const bindings = response.data?.results?.bindings || [];
      let addedCount = 0;

      for (const item of bindings) {
        const name = item.uavLabel?.value;
        // Skip unnamed Q-IDs
        if (!name || /^Q\d+$/.test(name)) continue;

        const wikidataId = item.uav?.value?.split('/').pop();
        const country = item.countryLabel?.value || 'International';
        const manufacturer = item.manufacturerLabel?.value || 'Aerospace Research Institute';
        const year = item.inception?.value ? new Date(item.inception.value).getFullYear() : 2020;
        const description =
          item.uavDescription?.value ||
          `${name} is an unmanned aerial vehicle developed by ${manufacturer} (${country}).`;

        const existing = await Drone.findOne({
          $or: [{ name: new RegExp(`^${name}$`, 'i') }, { 'automationMeta.wikidataId': wikidataId }]
        });

        if (!existing) {
          const newDrone = await Drone.create({
            name,
            manufacturer,
            country,
            category: 'Experimental',
            role: 'Unmanned Aerial System',
            introducedYear: isNaN(year) ? 2022 : year,
            status: 'Active',
            image: '/drones/default.jpg',
            specifications: {
              maxTakeoffWeightKg: item.mass?.value ? Number(item.mass.value) : 50,
              wingspanOrDiameterM: item.wingspan?.value ? Number(item.wingspan.value) : 4.5,
              propulsionType: 'Electric Brushless',
              autonomyLevel: 'GPS Waypoint'
            },
            academicNotes: {
              aerodynamicProfile: 'Standard UAV aerodynamic configuration',
              controlArchitecture: 'Closed-loop autopilot with telemetry downlink',
              sensorSuite: ['GNSS', 'IMU', 'Optical Camera'],
              learningTakeaways: ['Cataloged via automated Wikidata aerospace registry sync']
            },
            description,
            automationMeta: {
              source: 'Wikidata-Sync',
              wikidataId,
              sourceUrl: item.uav?.value,
              confidenceScore: 0.95,
              verified: true
            }
          });

          addedCount++;
          updateStream.broadcast('NEW_DRONE_DISCOVERED', newDrone);
        }
      }

      return { success: true, addedCount, scanned: bindings.length };
    } catch (error) {
      console.error('[WikidataSync] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 2. Scans live RSS news feeds and uses AI extraction to automatically add newly unveiled drones
   */
  async scanNewsForNewDrones() {
    if (this.isRunning) return { status: 'already_running' };
    this.isRunning = true;
    let newlyAddedDrones = [];

    try {
      for (const feedUrl of DRONE_RSS_FEEDS) {
        try {
          const feed = await parser.parseURL(feedUrl);
          const recentItems = (feed.items || []).slice(0, 5);

          for (const item of recentItems) {
            // Check if article was already processed
            const existingUpdate = await Update.findOne({ sourceUrl: item.link });
            if (existingUpdate) continue;

            const extracted = await aiService.extractDroneFromArticle(item);

            if (extracted && extracted.isDrone && extracted.name && extracted.confidenceScore >= 0.6) {
              let drone = await Drone.findOne({
                name: new RegExp(`^${extracted.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
              });

              if (!drone) {
                drone = await Drone.create({
                  name: extracted.name,
                  manufacturer: extracted.manufacturer || 'Emerging UAV Developer',
                  country: extracted.country || 'International',
                  category: extracted.category || 'Experimental',
                  role: extracted.role || 'Autonomous Aerial Platform',
                  introducedYear: extracted.introducedYear || new Date().getFullYear(),
                  status: extracted.status || 'Prototype',
                  image: '/drones/default.jpg',
                  specifications: {
                    maxSpeedKmh: extracted.specifications?.maxSpeedKmh || 0,
                    rangeKm: extracted.specifications?.rangeKm || 0,
                    enduranceHours: extracted.specifications?.enduranceHours || 0,
                    maxTakeoffWeightKg: extracted.specifications?.maxTakeoffWeightKg || 0,
                    payloadCapacityKg: extracted.specifications?.payloadCapacityKg || 0,
                    propulsionType: extracted.specifications?.propulsionType || 'Electric Brushless'
                  },
                  academicNotes: extracted.academicNotes || {
                    aerodynamicProfile: 'Newly announced airframe',
                    controlArchitecture: 'Modern autonomous flight controller',
                    sensorSuite: ['Onboard Telemetry'],
                    learningTakeaways: ['Discovered automatically via live RSS + AI ingestion']
                  },
                  description: extracted.description || item.contentSnippet || item.title,
                  automationMeta: {
                    source: 'AI-News-Discovery',
                    sourceUrl: item.link,
                    confidenceScore: extracted.confidenceScore,
                    verified: extracted.confidenceScore >= 0.85
                  }
                });

                newlyAddedDrones.push(drone);
                updateStream.broadcast('NEW_DRONE_DISCOVERED', drone);
              }

              // Log the update event in Update model
              const updateDoc = await Update.create({
                title: item.title,
                summary: extracted.description || item.contentSnippet || '',
                sourceUrl: item.link,
                sourceName: feed.title || 'UAV News Feed',
                relatedDrone: drone._id,
                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date()
              });

              updateStream.broadcast('NEWS_UPDATE', updateDoc);
            }
          }
        } catch (feedErr) {
          console.warn(`[NewsScanner] Failed to parse feed ${feedUrl}:`, feedErr.message);
        }
      }

      return { success: true, newDronesCount: newlyAddedDrones.length, newDrones: newlyAddedDrones };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 3. Starts automated background cron jobs (every 6 hours)
   */
  startCronJobs() {
    // Run News & New Drone Discovery every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('[Cron] Running automated new drone news discovery...');
      await this.scanNewsForNewDrones();
    });

    // Run Wikidata Global Registry Sync once daily at 02:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('[Cron] Running daily Wikidata global drone registry sync...');
      await this.syncFromWikidata(100);
    });

    console.log('[Automation] Scheduled cron jobs active (RSS AI Discovery + Wikidata Registry Sync).');
  }
}

module.exports = new AutomatedDroneDiscoveryService();
