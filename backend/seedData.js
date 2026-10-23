const Drone = require('./models/Drone');
const CounterSystem = require('./models/CounterSystem');
const Country = require('./models/Country');
const History = require('./models/History');

const INITIAL_DRONES = [
  {
    name: 'MQ-9 Reaper',
    manufacturer: 'General Atomics Aeronautical Systems',
    country: 'United States',
    countryCode: 'US',
    category: 'MALE / HALE Surveillance',
    type: 'MALE UCAV',
    role: 'Long-Endurance High-Altitude Surveillance & Scientific Telemetry',
    introducedYear: 2007,
    status: 'Active',
    image: '/drones/mq9.jpg',
    specifications: {
      maxSpeedKmh: 482,
      rangeKm: 1850,
      enduranceHours: 27,
      serviceCeilingM: 15240,
      maxTakeoffWeightKg: 4760,
      payloadCapacityKg: 1700,
      wingspanOrDiameterM: 20.1,
      propulsionType: 'Turboprop',
      autonomyLevel: 'GPS Waypoint'
    },
    tacticalData: {
      rcs: '0.5 m²',
      radarCrossSectionM2: 0.5,
      thermalSignature: 'Moderate (Honeywell TPE331 Turboprop)',
      acousticSignature: 'Moderate',
      ewResilience: 85,
      swarmCapable: false,
      communicationLinks: ['Ku-Band SATCOM', 'C-Band Line-of-Sight'],
      recommendedCounters: ['Patriot PAC-3', 'Pantsir-S1']
    },
    academicNotes: {
      aerodynamicProfile: 'High-aspect-ratio (AR = 11.5) laminar flow wing with Y-tail empennage',
      controlArchitecture: 'Triple-redundant flight control computer with Ku-band SATCOM BLOS link',
      sensorSuite: ['MTS-B Multi-Spectral Targeting System', 'Lynx Synthetic Aperture Radar', 'AIS Transponder'],
      learningTakeaways: ['High aspect ratio wings minimize induced drag (C_Di = C_L² / π·AR·e) for 27-hour endurance']
    },
    description: 'A turboprop-powered, multi-mission Medium-Altitude Long-Endurance (MALE) remotely piloted aircraft.'
  },
  {
    name: 'DRDO TAPAS-BH-201',
    manufacturer: 'ADE (DRDO) & Hindustan Aeronautics Limited (HAL)',
    country: 'India',
    countryCode: 'IN',
    category: 'MALE / HALE Surveillance',
    type: 'MALE ISTAR UAV',
    role: 'Indigenous Medium-Altitude Long-Endurance Surveillance & Reconnaissance',
    introducedYear: 2023,
    status: 'Active',
    image: '/drones/tapas.jpg',
    specifications: {
      maxSpeedKmh: 225,
      rangeKm: 1000,
      enduranceHours: 18,
      serviceCeilingM: 9144,
      maxTakeoffWeightKg: 1800,
      payloadCapacityKg: 350,
      wingspanOrDiameterM: 20.6,
      propulsionType: 'Turboprop',
      autonomyLevel: 'GPS Waypoint'
    },
    tacticalData: {
      rcs: '0.35 m²',
      radarCrossSectionM2: 0.35,
      thermalSignature: 'Low-Moderate',
      acousticSignature: 'Moderate',
      ewResilience: 80,
      swarmCapable: false,
      communicationLinks: ['Indigenous Ku-Band SATCOM', 'GAGAN SBAS Navigation'],
      recommendedCounters: ['Pantsir-S1', 'SkyFence EW']
    },
    academicNotes: {
      aerodynamicProfile: 'Twin-engine wing-mounted tractor configuration with high-aspect-ratio composite wing',
      controlArchitecture: 'Indigenous GAGAN-enabled autonomous takeoff and landing (ATOL) fault-tolerant FCS',
      sensorSuite: ['Synthetic Aperture Radar (SAR)', 'EO/IR Stabilized Gimbal', 'ELINT/COMINT Payload'],
      learningTakeaways: ['Demonstrates indigenous SBAS (GAGAN) differential GNSS precision for automated runway landing']
    },
    description: 'An Indian Medium-Altitude Long-Endurance UAV developed by DRDO featuring fully autonomous takeoff and landing.'
  },
  {
    name: 'Drishti-10 Starliner (Hermes 900)',
    manufacturer: 'Adani Defence & Aerospace / Elbit Systems',
    country: 'India',
    countryCode: 'IN',
    category: 'MALE / HALE Surveillance',
    type: 'All-Weather MALE UAV',
    role: 'Maritime & Land Persistent Wide-Area Surveillance',
    introducedYear: 2024,
    status: 'Active',
    image: '/drones/drishti10.jpg',
    specifications: {
      maxSpeedKmh: 220,
      rangeKm: 2000,
      enduranceHours: 36,
      serviceCeilingM: 9150,
      maxTakeoffWeightKg: 1180,
      payloadCapacityKg: 450,
      wingspanOrDiameterM: 15.0,
      propulsionType: 'Piston Engine',
      autonomyLevel: 'GPS Waypoint'
    },
    tacticalData: {
      rcs: '0.28 m²',
      radarCrossSectionM2: 0.28,
      thermalSignature: 'Low (Rotax 914 Turbocharged 4-Stroke)',
      acousticSignature: 'Low',
      ewResilience: 84,
      swarmCapable: false,
      communicationLinks: ['SATCOM', 'STANAG 4671 Civil Airspace Transponder'],
      recommendedCounters: ['Patriot PAC-3', 'Pantsir-S1']
    },
    academicNotes: {
      aerodynamicProfile: 'High-wing cantilever monoplane with V-tail reducing wetted surface drag',
      controlArchitecture: 'STANAG 4671 certified airworthiness architecture with de-icing & lightning protection',
      sensorSuite: ['Multi-Mode Maritime Radar', 'SkEye Wide-Area Persistent Optical Array', 'AIS'],
      learningTakeaways: ['Illustrates V-tail ruddervator control mixing where pitch and yaw moments are coupled']
    },
    description: 'An all-weather MALE UAV certified to operate in non-segregated civilian airspace with 36-hour endurance.'
  },
  {
    name: 'Bayraktar TB2',
    manufacturer: 'Baykar',
    country: 'Turkey',
    countryCode: 'TR',
    category: 'MALE / HALE Surveillance',
    type: 'Tactical MALE UAV',
    role: 'Medium-Altitude Tactical Reconnaissance & Laser Designation',
    introducedYear: 2014,
    status: 'Active',
    image: '/drones/tb2.png',
    specifications: {
      maxSpeedKmh: 220,
      rangeKm: 300,
      enduranceHours: 27,
      serviceCeilingM: 7620,
      maxTakeoffWeightKg: 700,
      payloadCapacityKg: 150,
      wingspanOrDiameterM: 12.0,
      propulsionType: 'Piston Engine',
      autonomyLevel: 'GPS Waypoint'
    },
    tacticalData: {
      rcs: '0.18 m²',
      radarCrossSectionM2: 0.18,
      thermalSignature: 'Low',
      acousticSignature: 'Low-Moderate',
      ewResilience: 76,
      swarmCapable: false,
      communicationLinks: ['C-Band LOS', 'Turksat SATCOM (TB2S)'],
      recommendedCounters: ['Pantsir-S1', 'SkyFence EW']
    },
    academicNotes: {
      aerodynamicProfile: 'Inverted V-tail twin-boom pusher configuration isolating nose optics from engine vibration',
      controlArchitecture: 'Triple-redundant sensor fusion flight control system with autonomous taxi/takeoff',
      sensorSuite: ['CATS / MX-15D EO/IR Laser Designator', 'Pitot-Static Air Data Computer'],
      learningTakeaways: ['Twin-boom pusher layout keeps the nose cone unobstructed for 360-degree gimbal optics']
    },
    description: 'A twin-boom pusher MALE UAV featuring carbon-fiber monocoque construction and triple-redundant avionics.'
  },
  {
    name: 'ideaForge NETRA V4 PRO',
    manufacturer: 'ideaForge Technology',
    country: 'India',
    countryCode: 'IN',
    category: 'Commercial & Photography',
    type: 'VTOL Quadcopter',
    role: 'High-Altitude Mapping, Disaster Relief & Search-and-Rescue',
    introducedYear: 2022,
    status: 'Active',
    image: '/drones/netra.png',
    specifications: {
      maxSpeedKmh: 54,
      rangeKm: 15,
      enduranceHours: 1.5,
      serviceCeilingM: 5500,
      maxTakeoffWeightKg: 7.5,
      payloadCapacityKg: 1.2,
      wingspanOrDiameterM: 1.1,
      propulsionType: 'LiPo Multirotor',
      autonomyLevel: 'Obstacle Avoidance'
    },
    tacticalData: {
      rcs: '0.02 m²',
      radarCrossSectionM2: 0.02,
      thermalSignature: 'Minimal (Brushless Electric)',
      acousticSignature: 'Low',
      ewResilience: 72,
      swarmCapable: false,
      communicationLinks: ['AES-256 Encrypted Digital Datalink'],
      recommendedCounters: ['DroneHunter F700', 'Titan C-UAS']
    },
    academicNotes: {
      aerodynamicProfile: 'High-altitude carbon-fiber quadrotor with low-disk-loading propellers for thin air (5,500m)',
      controlArchitecture: 'Attitude/Rate cascaded PID controller with automatic Return-to-Home (RTH)',
      sensorSuite: ['10x HD Optical + 640x480 Thermal Gimbal', 'PPK/RTK Survey GNSS'],
      learningTakeaways: ['Demonstrates high-altitude propeller pitch optimization where air density drops below 0.7 kg/m³']
    },
    description: 'A ruggedized Indian VTOL quadcopter engineered for high-altitude surveying and emergency response.'
  },
  {
    name: 'ideaForge SWITCH UAV',
    manufacturer: 'ideaForge Technology',
    country: 'India',
    countryCode: 'IN',
    category: 'Academic & Research',
    type: 'Hybrid Fixed-Wing VTOL',
    role: 'Long-Range Photogrammetry, GIS Surveying & Infrastructure Inspection',
    introducedYear: 2021,
    status: 'Active',
    image: '/drones/switch.png',
    specifications: {
      maxSpeedKmh: 72,
      rangeKm: 25,
      enduranceHours: 2.0,
      serviceCeilingM: 4500,
      maxTakeoffWeightKg: 6.5,
      payloadCapacityKg: 0.8,
      wingspanOrDiameterM: 2.6,
      propulsionType: 'Hybrid-Electric',
      autonomyLevel: 'GPS Waypoint'
    },
    tacticalData: {
      rcs: '0.03 m²',
      radarCrossSectionM2: 0.03,
      thermalSignature: 'Minimal',
      acousticSignature: 'Low',
      ewResilience: 75,
      swarmCapable: false,
      communicationLinks: ['Encrypted Spread-Spectrum Telemetry'],
      recommendedCounters: ['DroneHunter F700', 'Titan C-UAS']
    },
    academicNotes: {
      aerodynamicProfile: 'QuadPlane hybrid VTOL: 4 vertical lift rotors + 1 pusher cruise propeller',
      controlArchitecture: 'Transition control law blending hover PID loops with fixed-wing Total Energy Control System (TECS)',
      sensorSuite: ['25x Optical Zoom', 'Thermal Radiometric Imager'],
      learningTakeaways: ['Benchmark platform for studying VTOL-to-Fixed-Wing transition aerodynamics and stall prevention']
    },
    description: 'A hybrid VTOL and fixed-wing UAV combining runway-independent vertical takeoff with efficient winged cruise.'
  },
  {
    name: 'IoTechWorld AgriBot',
    manufacturer: 'IoTechWorld Avigation',
    country: 'India',
    countryCode: 'IN',
    category: 'Agricultural',
    type: 'Heavy Agricultural Hexacopter',
    role: 'Precision Crop Spraying & Multispectral NDVI Soil/Crop Analytics',
    introducedYear: 2022,
    status: 'Active',
    image: '/drones/agribot.png',
    specifications: {
      maxSpeedKmh: 36,
      rangeKm: 3,
      enduranceHours: 0.4,
      serviceCeilingM: 500,
      maxTakeoffWeightKg: 29.5,
      payloadCapacityKg: 10.0,
      wingspanOrDiameterM: 1.8,
      propulsionType: 'LiPo Multirotor',
      autonomyLevel: 'Obstacle Avoidance'
    },
    tacticalData: {
      rcs: '0.08 m²',
      radarCrossSectionM2: 0.08,
      thermalSignature: 'Low',
      acousticSignature: 'Moderate',
      ewResilience: 55,
      swarmCapable: false,
      communicationLinks: ['2.4 GHz / 5.8 GHz Telemetry + RTK'],
      recommendedCounters: ['Titan C-UAS', 'DroneHunter F700']
    },
    academicNotes: {
      aerodynamicProfile: 'Hexacopter rotor downwash vortex optimization for uniform foliar droplet penetration',
      controlArchitecture: 'Millimeter-wave terrain-following radar with variable-mass adaptive PID gain scheduling',
      sensorSuite: ['77 GHz Terrain-Following Radar', 'Peristaltic Flowmeter', 'NDVI Multispectral Sensor'],
      learningTakeaways: ['Shows how flight controllers adapt PID gains dynamically as liquid payload mass decreases mid-flight']
    },
    description: 'DGCA type-certified agricultural hexacopter engineered for autonomous precision crop spraying.'
  },
  {
    name: 'Archer Midnight eVTOL',
    manufacturer: 'Archer Aviation',
    country: 'United States',
    countryCode: 'US',
    category: 'Urban Air Mobility (eVTOL)',
    type: 'Tilt-Propeller eVTOL Air Taxi',
    role: 'Sustainable Urban Air Mobility & Rapid Passenger Transit',
    introducedYear: 2025,
    status: 'Active',
    image: '/drones/airtaxi.jpg',
    specifications: {
      maxSpeedKmh: 241,
      rangeKm: 160,
      enduranceHours: 1.0,
      serviceCeilingM: 3000,
      maxTakeoffWeightKg: 3175,
      payloadCapacityKg: 454,
      wingspanOrDiameterM: 14.6,
      propulsionType: 'Electric Brushless',
      autonomyLevel: 'Obstacle Avoidance'
    },
    tacticalData: {
      rcs: '1.2 m²',
      radarCrossSectionM2: 1.2,
      thermalSignature: 'Low',
      acousticSignature: 'Ultra-Low (45 dBA at cruise)',
      ewResilience: 82,
      swarmCapable: false,
      communicationLinks: ['IFR Civil Avionics Suite', 'ADS-B Out/In'],
      recommendedCounters: ['Patriot PAC-3']
    },
    academicNotes: {
      aerodynamicProfile: '12-propeller Distributed Electric Propulsion (DEP): 6 tilt-props forward + 6 aft lift-only props',
      controlArchitecture: 'Triple-redundant fly-by-wire fault-tolerant actuator allocation across 6 independent battery packs',
      sensorSuite: ['Redundant Air Data Computers', 'Radar Altimeters', 'EO Detect-and-Avoid'],
      learningTakeaways: ['Demonstrates Distributed Electric Propulsion (DEP) acoustic reduction and tilt-rotor transition']
    },
    description: 'An electric vertical takeoff and landing (eVTOL) aircraft designed for low-noise urban air mobility.'
  },
  {
    name: 'Black Hornet 4 PRS',
    manufacturer: 'Teledyne FLIR',
    country: 'Norway',
    countryCode: 'NO',
    category: 'Micro / Nano UAV',
    type: 'Nano Single-Rotor Helicopter',
    role: 'Confined-Space & GPS-Denied Micro Reconnaissance',
    introducedYear: 2023,
    status: 'Active',
    image: '/drones/blackhornet.png',
    specifications: {
      maxSpeedKmh: 36,
      rangeKm: 3,
      enduranceHours: 0.55,
      serviceCeilingM: 2000,
      maxTakeoffWeightKg: 0.07,
      payloadCapacityKg: 0.015,
      wingspanOrDiameterM: 0.19,
      propulsionType: 'Electric Brushless',
      autonomyLevel: 'Full Autonomous SLAM'
    },
    tacticalData: {
      rcs: '0.001 m²',
      radarCrossSectionM2: 0.001,
      thermalSignature: 'Negligible',
      acousticSignature: 'Near-Silent',
      ewResilience: 78,
      swarmCapable: false,
      communicationLinks: ['Encrypted Digital Micro-Datalink'],
      recommendedCounters: ['Titan C-UAS', 'SkyFence EW']
    },
    academicNotes: {
      aerodynamicProfile: 'Single-main-rotor swashplate nano-helicopter operating in low Reynolds number regime (Re < 50,000)',
      controlArchitecture: 'Visual-Inertial Odometry (VIO) optical flow navigation for GPS-denied environments',
      sensorSuite: ['12MP Low-Light Electro-Optical', 'Thermal Micro-Bolometer', 'Optical Flow Camera'],
      learningTakeaways: ['Key case study for low-Reynolds-number boundary layer aerodynamics and ultra-low SWaP avionics']
    },
    description: 'Weighing just 70 grams, this nano-UAV uses single-rotor helicopter mechanics and visual-inertial odometry.'
  },
  {
    name: 'Swarm-X Collaborative Mesh',
    manufacturer: 'Autonomous Robotics Consortium',
    country: 'United States',
    countryCode: 'US',
    category: 'Autonomous Swarm',
    type: 'Decentralized Swarm UAV',
    role: 'Multi-Agent Collaborative 3D SLAM Mapping & Search-and-Rescue',
    introducedYear: 2025,
    status: 'Prototype',
    isTheoretical: true,
    image: '/drones/swarmx.jpg',
    specifications: {
      maxSpeedKmh: 95,
      rangeKm: 45,
      enduranceHours: 1.8,
      serviceCeilingM: 3500,
      maxTakeoffWeightKg: 4.2,
      payloadCapacityKg: 1.0,
      wingspanOrDiameterM: 0.65,
      propulsionType: 'LiPo Multirotor',
      autonomyLevel: 'AI Swarm Collaborative'
    },
    tacticalData: {
      rcs: '0.015 m²',
      radarCrossSectionM2: 0.015,
      thermalSignature: 'Low',
      acousticSignature: 'Moderate',
      ewResilience: 92,
      swarmCapable: true,
      communicationLinks: ['Ultra-Wideband (UWB) Decentralized Mesh', 'Optical Relative Ranging'],
      recommendedCounters: ['Iron Beam', 'SkyFence EW']
    },
    academicNotes: {
      aerodynamicProfile: 'Ducted-fan shrouded quadrotor for close-proximity collision resilience',
      controlArchitecture: 'Olfati-Saber decentralized consensus flocking algorithm with Voronoi area partitioning',
      sensorSuite: ['3D Solid-State LiDAR', 'UWB Inter-Drone Transceiver', 'Stereo Depth Cameras'],
      learningTakeaways: ['Demonstrates decentralized consensus algorithms, Voronoi tessellation, and distributed SLAM']
    },
    description: 'An academic and industrial swarm robotics platform coordinating dozens of UAVs via decentralized mesh networking.'
  }
];

const INITIAL_COUNTER_SYSTEMS = [
  {
    name: 'DroneHunter F700',
    manufacturer: 'Fortem Technologies',
    country: 'United States',
    type: 'Autonomous Kinetic Net-Capture Interceptor UAV',
    rangeKm: 5,
    range_km: 5,
    effectiveness: 88,
    image: '/counter/DroneHunter F700.png',
    photo_url: '/counter/DroneHunter F700.png',
    description: 'AI-driven autonomous interceptor drone using onboard TrueView R20 radar to capture rogue Group 1 & 2 UAVs with tether-nets and tow them safely via parachute.'
  },
  {
    name: 'Iron Beam',
    manufacturer: 'Rafael Advanced Defense Systems',
    country: 'Israel',
    type: '100kW High-Energy Laser Weapon System (HELWS)',
    rangeKm: 10,
    range_km: 10,
    effectiveness: 94,
    image: '/counter/Iron Beam1.jpg',
    photo_url: '/counter/Iron Beam1.jpg',
    description: 'Directed-energy fiber-laser air defense system designed to thermally neutralize autonomous drone swarms and micro-UAVs at the speed of light with near-zero cost per intercept.'
  },
  {
    name: 'SkyFence EW',
    manufacturer: 'Electro-Optical & RF Defense Consortium',
    country: 'United Kingdom',
    type: 'Multi-Band Electronic Warfare & GNSS Protocol Jammer',
    rangeKm: 8,
    range_km: 8,
    effectiveness: 85,
    image: '/counter/SkyFence EW1.jpg',
    photo_url: '/counter/SkyFence EW1.jpg',
    description: 'Phased-array electronic countermeasures wall that detects RF command links and projects an electromagnetic barrier to force unauthorized drones into safe vertical landings.'
  },
  {
    name: 'Titan C-UAS',
    manufacturer: 'Citadel Defense / BlueHalo',
    country: 'United States',
    type: 'AI-Powered RF Cyber-Takeover & Spectrum Dominance',
    rangeKm: 6,
    range_km: 6,
    effectiveness: 89,
    image: '/counter/Titan C-UAS1.jpg',
    photo_url: '/counter/Titan C-UAS1.jpg',
    description: 'Automated machine-learning RF sensor and non-kinetic effector that identifies drone protocols in real time and executes surgical link-disruption without collateral spectrum interference.'
  },
  {
    name: 'Pantsir-S1',
    manufacturer: 'KBP Instrument Design Bureau',
    country: 'Russia',
    type: 'Combined Short-to-Medium Range SAM & Twin 30mm Autocannon',
    rangeKm: 20,
    range_km: 20,
    effectiveness: 86,
    image: '/counter/Pantsir-S11.jpg',
    photo_url: '/counter/Pantsir-S11.jpg',
    description: 'Integrated phased-array radar and electro-optical point-defense system designed to engage MALE UAVs and high-speed aerial targets.'
  },
  {
    name: 'Patriot PAC-3 MSE',
    manufacturer: 'Raytheon / Lockheed Martin',
    country: 'United States',
    type: 'Long-Range Phased-Array Radar & Hit-to-Kill Interceptor',
    rangeKm: 70,
    range_km: 70,
    effectiveness: 95,
    image: '/counter/Patriot PAC-31.jpg',
    photo_url: '/counter/Patriot PAC-31.jpg',
    description: 'High-altitude theatre air defense system capable of tracking and intercepting high-altitude HALE/MALE unmanned aircraft.'
  }
];

const INITIAL_COUNTRIES = [
  {
    name: 'India',
    code: 'IN',
    region: 'South Asia',
    droneCount: 4,
    drone_count: 4,
    leadingManufacturers: ['DRDO (ADE)', 'Hindustan Aeronautics Limited (HAL)', 'ideaForge', 'IoTechWorld', 'Adani Defence'],
    keyTestCenters: ['Chitradurga Aeronautical Test Range (ATR)', 'IIT Kanpur UAV Flight Lab', 'IISc Bangalore Robotics Lab'],
    regulatoryBody: 'DGCA (Drone Rules 2021 & Digital Sky Platform)',
    summary: 'Rapidly expanding indigenous UAV ecosystem spanning DRDO MALE platforms (TAPAS), hybrid VTOLs (SWITCH), and certified agricultural spraying drones (AgriBot).'
  },
  {
    name: 'United States',
    code: 'US',
    region: 'North America',
    droneCount: 3,
    drone_count: 3,
    leadingManufacturers: ['General Atomics', 'Northrop Grumman', 'Skydio', 'Archer Aviation', 'Joby Aviation'],
    keyTestCenters: ['Creech AFB', 'NASA Armstrong Flight Research Center', 'MIT CSAIL Aerospace Lab'],
    regulatoryBody: 'FAA (Part 107 & BVLOS Airworthiness Waivers)',
    summary: 'Global leader in high-altitude long-endurance (HALE/MALE) systems, distributed electric propulsion eVTOLs, and autonomous AI swarms.'
  },
  {
    name: 'Turkey',
    code: 'TR',
    region: 'Eurasia',
    droneCount: 1,
    drone_count: 1,
    leadingManufacturers: ['Baykar', 'Turkish Aerospace Industries (TAI)', 'STM'],
    keyTestCenters: ['Keşan Flight Training and Test Center', 'Aksungur Aerospace Facility'],
    regulatoryBody: 'SHGM (Directorate General of Civil Aviation)',
    summary: 'Major developer of composite twin-boom MALE UAVs (Bayraktar TB2, Akıncı) and autonomous jet-powered unmanned aircraft (Kızılelma).'
  },
  {
    name: 'Norway',
    code: 'NO',
    region: 'Europe',
    droneCount: 1,
    drone_count: 1,
    leadingManufacturers: ['Teledyne FLIR (Prox Dynamics)', 'Kongsberg'],
    keyTestCenters: ['Andøya Test Center'],
    regulatoryBody: 'CAA Norway / EASA',
    summary: 'Pioneer in ultra-lightweight nano-rotary aerodynamics and GPS-denied visual-inertial micro-UAV engineering.'
  }
];

const INITIAL_HISTORY = [
  {
    year: 1917,
    title: 'Ruston Proctor Aerial Target & Kettering Bug',
    era: 'Early Radio-Control Pioneers',
    description: 'Archibald Low and Charles Kettering demonstrate the first gyroscopically stabilized, radio-guided unmanned aircraft.'
  },
  {
    year: 1995,
    title: 'MQ-1 Predator & SATCOM Beyond-Line-of-Sight',
    era: 'Digital Satellite Telemetry Era',
    description: 'Integration of GPS navigation with Ku-band satellite communications enables real-time transcontinental UAV flight control.'
  },
  {
    year: 2010,
    title: 'MEMS Inertial Sensors & Brushless LiPo Multirotor Revolution',
    era: 'Commercial & Academic Quadrotor Boom',
    description: 'Low-cost MEMS gyroscopes, lithium-polymer batteries, and open-source autopilots (ArduPilot, PX4) democratize academic UAV research.'
  },
  {
    year: 2021,
    title: 'India Drone Rules & Hybrid VTOL Standardization',
    era: 'Regulated Airspace & Indigenous Autonomy',
    description: 'India liberalizes academic and commercial UAV R&D while hybrid QuadPlane VTOLs and agricultural hexacopters enter widespread service.'
  },
  {
    year: 2026,
    title: 'Edge-AI Visual SLAM, eVTOL Certification & Decentralized Swarms',
    era: 'Autonomous & Collaborative Aerospace Era',
    description: 'Onboard neural processors enable GPS-denied Visual-Inertial Odometry (VIO), collaborative multi-agent swarms, and certified urban air mobility.'
  }
];

async function ensureSeedData() {
  try {
    if ((await Drone.countDocuments()) === 0) {
      for (const d of INITIAL_DRONES) await Drone.create(d);
      console.log(`[Seed] Inserted ${INITIAL_DRONES.length} Pro UAV profiles.`);
    }
    if ((await CounterSystem.countDocuments().catch(() => 1)) === 0) {
      await CounterSystem.insertMany(INITIAL_COUNTER_SYSTEMS).catch(() => {});
      console.log(`[Seed] Inserted ${INITIAL_COUNTER_SYSTEMS.length} Counter-UAS systems.`);
    }
    if ((await Country.countDocuments().catch(() => 1)) === 0) {
      await Country.insertMany(INITIAL_COUNTRIES).catch(() => {});
      console.log(`[Seed] Inserted ${INITIAL_COUNTRIES.length} Country Geo-Intel profiles.`);
    }
    if ((await History.countDocuments().catch(() => 1)) === 0) {
      await History.insertMany(INITIAL_HISTORY).catch(() => {});
      console.log(`[Seed] Inserted ${INITIAL_HISTORY.length} Historical UAV milestones.`);
    }
  } catch (err) {
    console.warn('[Seed] Non-fatal seed warning:', err.message);
  }
}

module.exports = { ensureSeedData, INITIAL_DRONES, INITIAL_COUNTER_SYSTEMS, INITIAL_COUNTRIES, INITIAL_HISTORY };
