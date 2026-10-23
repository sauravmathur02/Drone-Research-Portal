const Parser = require('rss-parser');
const axios = require('axios');
const cron = require('node-cron');
const Drone = require('../models/Drone');
const Update = require('../models/Update');
const aiService = require('./aiService');
const updateStream = require('../utils/updateStream');

let tfidfSearch = null;
try {
  tfidfSearch = require('../utils/droneTfidfSearch');
} catch (_) {}

const parser = new Parser({ timeout: 12000 });

const DRONE_RSS_FEEDS = [
  'https://dronedj.com/feed/',
  'https://www.unmannedairspace.info/feed/',
  'https://dronelife.com/feed/',
  'http://export.arxiv.org/rss/cs.RO' // ArXiv Robotics & Autonomous UAV Research Papers
];

class AutomatedDroneDiscoveryService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Engine 1: Wikidata Global UAV Registry SPARQL Harvester (All Existing Cataloged Drones)
   */
  async syncFromWikidata(limit = 60) {
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
        headers: { 'User-Agent': 'DroneResearchPortal/3.0 (Academic & Aerospace Research)' },
        timeout: 15000
      });

      const bindings = response.data?.results?.bindings || [];
      let addedCount = 0;

      for (const item of bindings) {
        const name = item.uavLabel?.value;
        if (!name || /^Q\d+$/.test(name)) continue;

        const wikidataId = item.uav?.value?.split('/').pop();
        const country = item.countryLabel?.value || 'International';
        const manufacturer = item.manufacturerLabel?.value || 'Aerospace Research Division';
        const year = item.inception?.value ? new Date(item.inception.value).getFullYear() : 2021;
        const description =
          item.uavDescription?.value ||
          `${name} is an unmanned aerial system developed by ${manufacturer} (${country}).`;

        const existing = await Drone.findOne({
          $or: [
            { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            { 'automationMeta.wikidataId': wikidataId }
          ]
        });

        if (!existing) {
          const newDrone = await Drone.create({
            name,
            manufacturer,
            country,
            origin: country,
            category: 'Tactical / Multi-Role',
            type: 'Unmanned Aerial Vehicle',
            role: 'Aerial Reconnaissance & Autonomous Research',
            introducedYear: isNaN(year) ? 2021 : year,
            year: isNaN(year) ? 2021 : year,
            status: 'Active',
            image: '/drones/default.jpg',
            specifications: {
              maxTakeoffWeightKg: item.mass?.value ? Number(item.mass.value) : 45,
              wingspanOrDiameterM: item.wingspan?.value ? Number(item.wingspan.value) : 4.2,
              propulsionType: 'Electric / Piston',
              autonomyLevel: 'GPS Waypoint'
            },
            academicNotes: {
              aerodynamicProfile: 'Cataloged airframe from global Wikidata aerospace ontology',
              controlArchitecture: 'Closed-loop autopilot with redundant GNSS/INS navigation',
              sensorSuite: ['EO/IR Gimbal', 'GNSS/INS', 'Telemetry Transceiver'],
              learningTakeaways: ['Automatically synchronized from Wikidata UAV Registry (wd:Q484000)']
            },
            description,
            automationMeta: {
              source: 'Wikidata-SPARQL',
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

      if (addedCount > 0 && tfidfSearch && typeof tfidfSearch.rebuildIndex === 'function') {
        await tfidfSearch.rebuildIndex();
      }

      return { success: true, addedCount, scanned: bindings.length };
    } catch (error) {
      console.error('[WikidataSync] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Engine 2: Live RSS & ArXiv Academic Scanner for Newly Unveiled Drones
   */
  async scanNewsForNewDrones() {
    if (this.isRunning) return { status: 'already_running' };
    this.isRunning = true;
    const newlyAddedDrones = [];

    try {
      for (const feedUrl of DRONE_RSS_FEEDS) {
        try {
          const feed = await parser.parseURL(feedUrl);
          const isArxiv = feedUrl.includes('arxiv.org');
          const recentItems = (feed.items || []).slice(0, 6);

          for (const item of recentItems) {
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
                  manufacturer: extracted.manufacturer || 'Emerging Aerospace Lab',
                  country: extracted.country || 'International',
                  origin: extracted.country || 'International',
                  category: extracted.category || (isArxiv ? 'Academic & Research' : 'Experimental'),
                  type: extracted.category || 'Autonomous UAV',
                  role: extracted.role || 'Next-Gen Unmanned Aerial System',
                  introducedYear: extracted.introducedYear || new Date().getFullYear(),
                  year: extracted.introducedYear || new Date().getFullYear(),
                  status: extracted.status || 'Prototype',
                  image: '/drones/default.jpg',
                  specifications: {
                    maxSpeedKmh: extracted.specifications?.maxSpeedKmh || 110,
                    rangeKm: extracted.specifications?.rangeKm || 50,
                    enduranceHours: extracted.specifications?.enduranceHours || 2,
                    maxTakeoffWeightKg: extracted.specifications?.maxTakeoffWeightKg || 15,
                    payloadCapacityKg: extracted.specifications?.payloadCapacityKg || 3,
                    propulsionType: extracted.specifications?.propulsionType || 'Electric Brushless'
                  },
                  academicNotes: {
                    aerodynamicProfile:
                      extracted.academicNotes?.aerodynamicProfile || 'Next-gen composite airframe',
                    controlArchitecture:
                      extracted.academicNotes?.controlArchitecture || 'Onboard edge-AI autonomy stack',
                    sensorSuite: extracted.academicNotes?.sensorSuite || ['EO/IR', 'LiDAR', 'VIO'],
                    learningTakeaways: extracted.academicNotes?.learningTakeaways || [
                      'Automatically ingested from live global UAV intelligence feed'
                    ],
                    referencePapers: isArxiv
                      ? [{ title: item.title, url: item.link, year: new Date().getFullYear() }]
                      : []
                  },
                  description: extracted.description || item.contentSnippet || item.title,
                  automationMeta: {
                    source: isArxiv ? 'ArXiv-Academic' : 'AI-RSS-Discovery',
                    sourceUrl: item.link,
                    confidenceScore: extracted.confidenceScore,
                    verified: extracted.confidenceScore >= 0.85
                  }
                });

                newlyAddedDrones.push(drone);
                updateStream.broadcast('NEW_DRONE_DISCOVERED', drone);
              }

              const updateDoc = await Update.create({
                title: item.title,
                summary: extracted.description || item.contentSnippet || '',
                sourceUrl: item.link,
                sourceName: feed.title || (isArxiv ? 'ArXiv Robotics' : 'Global UAV Feed'),
                relatedDrone: drone._id,
                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date()
              });

              updateStream.broadcast('NEWS_UPDATE', updateDoc);
            }
          }
        } catch (feedErr) {
          console.warn(`[NewsScanner] Feed warning (${feedUrl}):`, feedErr.message);
        }
      }

      if (newlyAddedDrones.length > 0 && tfidfSearch && typeof tfidfSearch.rebuildIndex === 'function') {
        await tfidfSearch.rebuildIndex();
      }

      return { success: true, newDronesCount: newlyAddedDrones.length, newDrones: newlyAddedDrones };
    } finally {
      this.isRunning = false;
    }
  }

  async runFullDiscoveryPipeline(mode = 'all') {
    const output = {};
    if (mode === 'all' || mode === 'wikidata') {
      output.wikidata = await this.syncFromWikidata(50);
    }
    if (mode === 'all' || mode === 'news') {
      output.news = await this.scanNewsForNewDrones();
    }
    return output;
  }

  startCronJobs() {
    cron.schedule('0 */6 * * *', async () => {
      await this.scanNewsForNewDrones();
    });
    cron.schedule('0 2 * * *', async () => {
      await this.syncFromWikidata(100);
    });
    console.log('[Automation] Pro Multi-Source Drone Discovery Cron Jobs Active.');
  }
}

module.exports = new AutomatedDroneDiscoveryService();
