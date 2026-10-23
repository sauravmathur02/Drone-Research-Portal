const Drone = require('./models/Drone');

const INITIAL_DRONES = [
  {
    name: 'MQ-9 Reaper',
    manufacturer: 'General Atomics',
    country: 'United States',
    countryCode: 'US',
    category: 'MALE / HALE Surveillance',
    role: 'Long-Endurance High-Altitude Surveillance & Reconnaissance',
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
    academicNotes: {
      aerodynamicProfile: 'High-aspect-ratio low-drag laminar wing with Y-tail empennage',
      controlArchitecture: 'Triple-redundant flight control computer with Ku-band SATCOM beyond-line-of-sight link',
      sensorSuite: ['MTS-B Multi-Spectral Targeting System', 'Lynx Synthetic Aperture Radar', 'AIS Maritime Transponder'],
      learningTakeaways: ['Demonstrates how high aspect ratio wings maximize lift-to-drag ratio (L/D) for 27-hour endurance']
    },
    description: 'A turboprop-powered, multi-mission Medium-Altitude Long-Endurance (MALE) remotely piloted aircraft used for wide-area surveillance and scientific atmospheric monitoring.'
  },
  {
    name: 'DRDO TAPAS-BH-201',
    manufacturer: 'Aeronautical Development Establishment (DRDO) / HAL',
    country: 'India',
    countryCode: 'IN',
    category: 'MALE / HALE Surveillance',
    role: 'Indigenous Medium-Altitude Long-Endurance ISTAR Platform',
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
    academicNotes: {
      aerodynamicProfile: 'Twin-wingtractor configuration with composite airframe and T-tail',
      controlArchitecture: 'Indigenous GAGAN-enabled autonomous takeoff and landing (ATOL) system',
      sensorSuite: ['EO/IR Stabilized Payload', 'Synthetic Aperture Radar (SAR)', 'Medium Range Electro-Optical (MREO)'],
      learningTakeaways: ['Illustrates indigenous autonomous takeoff and landing using satellite-based augmentation systems (SBAS)']
    },
    description: 'An Indian Medium-Altitude Long-Endurance unmanned aerial vehicle developed by DRDO featuring fully autonomous takeoff and landing capabilities.'
  },
  {
    name: 'Drishti-10 Starliner (Hermes 900)',
    manufacturer: 'Adani Defence & Aerospace / Elbit Systems',
    country: 'India',
    countryCode: 'IN',
    category: 'MALE / HALE Surveillance',
    role: 'All-Weather Maritime & Land Intelligence, Surveillance, and Reconnaissance',
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
    academicNotes: {
      aerodynamicProfile: 'High-wing cantilever monoplane with V-tail reducing wetted surface area',
      controlArchitecture: 'STANAG 4671 certified airworthiness architecture for civil/non-segregated airspace',
      sensorSuite: ['Multi-Mode Maritime Radar', 'SkEye Wide-Area Persistent Stare', 'Automatic Identification System (AIS)'],
      learningTakeaways: ['Shows V-tail ruddervator control mixing where pitch and yaw moments are coupled']
    },
    description: 'An all-weather MALE UAV certified to fly in civilian airspace, capable of 36-hour continuous endurance with a 450 kg modular payload bay.'
  },
  {
    name: 'ideaForge NETRA V4 PRO',
    manufacturer: 'ideaForge Technology',
    country: 'India',
    countryCode: 'IN',
    category: 'Commercial & Photography',
    role: 'Quadcopter VTOL Mapping, Disaster Relief & Crowd Monitoring',
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
    academicNotes: {
      aerodynamicProfile: 'High-efficiency carbon-fiber quadrotor optimized for high-altitude thin air density',
      controlArchitecture: 'Fail-safe return-to-home (RTH) on communication loss or low battery voltage',
      sensorSuite: ['HD Day/Thermal Dual Gimbal', 'PPK/RTK Survey Module', 'Barometric Altimeter'],
      learningTakeaways: ['Demonstrates high-altitude propeller pitch optimization where air density drops below 0.7 kg/m³']
    },
    description: 'A ruggedized Indian VTOL quadcopter designed for high-altitude surveying, search-and-rescue, and emergency response operations.'
  },
  {
    name: 'ideaForge SWITCH UAV',
    manufacturer: 'ideaForge Technology',
    country: 'India',
    countryCode: 'IN',
    category: 'Academic & Research',
    role: 'Hybrid Fixed-Wing VTOL Photogrammetry & Long-Range Inspection',
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
    academicNotes: {
      aerodynamicProfile: 'QuadPlane hybrid VTOL: 4 vertical lift rotors + 1 pusher cruise propeller',
      controlArchitecture: 'Transition flight control law blending hover PID loops with fixed-wing TECS (Total Energy Control System)',
      sensorSuite: ['25x Optical Zoom', '640x480 Thermal Radiometric Sensor'],
      learningTakeaways: ['Ideal case study for VTOL-to-Fixed-Wing transition aerodynamics and stall prevention']
    },
    description: 'A hybrid VTOL and fixed-wing UAV combining runway-independent vertical takeoff with efficient winged cruise flight.'
  },
  {
    name: 'IoTechWorld AgriBot',
    manufacturer: 'IoTechWorld Avigation',
    country: 'India',
    countryCode: 'IN',
    category: 'Agricultural',
    role: 'Precision Agriculture Crop Spraying & Multispectral Soil Health Analysis',
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
    academicNotes: {
      aerodynamicProfile: 'Hexacopter downwash vortex utilization for uniform foliar droplet penetration',
      controlArchitecture: 'Terrain-following millimeter-wave radar with dynamic variable-mass PID gain scheduling',
      sensorSuite: ['Millimeter-Wave Terrain Radar', 'Flowmeter Nozzle Controller', 'NDVI Multispectral Camera'],
      learningTakeaways: ['Shows how flight controllers adapt PID gains dynamically as liquid payload mass decreases mid-flight']
    },
    description: 'DGCA type-certified agricultural hexacopter engineered for autonomous precision crop spraying and NDVI crop health analytics.'
  },
  {
    name: 'Archer Midnight eVTOL',
    manufacturer: 'Archer Aviation',
    country: 'United States',
    countryCode: 'US',
    category: 'Urban Air Mobility (eVTOL)',
    role: 'Electric Vertical Takeoff and Landing Air Taxi',
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
    academicNotes: {
      aerodynamicProfile: '12-propeller distributed electric propulsion (DEP): 6 tilt-props forward + 6 aft lift-only props',
      controlArchitecture: 'Fly-by-wire fault-tolerant architecture with 6 independent battery packs',
      sensorSuite: ['Redundant Air Data Computers', 'Radar Altimeters', 'Electro-Optical Detect-and-Avoid'],
      learningTakeaways: ['Demonstrates Distributed Electric Propulsion (DEP) acoustic reduction and tilt-rotor transition']
    },
    description: 'A next-generation electric vertical takeoff and landing (eVTOL) aircraft designed for sustainable, low-noise urban air mobility.'
  },
  {
    name: 'Black Hornet 4 PRS',
    manufacturer: 'Teledyne FLIR',
    country: 'Norway',
    countryCode: 'NO',
    category: 'Micro / Nano UAV',
    role: 'Pocket-Sized Nano-UAV for Indoor & Confined-Space Reconnaissance',
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
    academicNotes: {
      aerodynamicProfile: 'Single-main-rotor swashplate nano-helicopter operating in low Reynolds number regime (Re < 50,000)',
      controlArchitecture: 'Visual-Inertial Odometry (VIO) for GPS-denied indoor navigation',
      sensorSuite: ['12MP Low-Light Optical', 'High-Res Thermal Micro-Bolometer', 'Optical Flow Sensor'],
      learningTakeaways: ['Explores low-Reynolds-number boundary layer aerodynamics and ultra-low-SWaP (Size, Weight, and Power) avionics']
    },
    description: 'Weighing just 70 grams, this nano-UAV uses single-rotor helicopter mechanics and visual-inertial odometry to operate in GPS-denied environments.'
  },
  {
    name: 'Bayraktar TB2',
    manufacturer: 'Baykar',
    country: 'Turkey',
    countryCode: 'TR',
    category: 'MALE / HALE Surveillance',
    role: 'Medium-Altitude Long-Endurance Tactical UAV',
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
    academicNotes: {
      aerodynamicProfile: 'Inverted V-tail twin-boom pusher configuration isolating fuselage sensors from exhaust vibration',
      controlArchitecture: 'Triple-redundant sensor fusion flight control system',
      sensorSuite: ['WESCAM MX-15D / CATS EO/IR', 'Laser Rangefinder', 'Pitot-Static Air Data System'],
      learningTakeaways: ['Twin-boom pusher layout keeps the nose cone completely unobstructed for 360-degree gimbal optics']
    },
    description: 'A widely studied twin-boom pusher MALE unmanned aerial vehicle featuring carbon-fiber monocoque construction and triple-redundant avionics.'
  },
  {
    name: 'Swarm-X Collaborative Mesh',
    manufacturer: 'Autonomous Robotics Consortium',
    country: 'United States',
    countryCode: 'US',
    category: 'Autonomous Swarm',
    role: 'Decentralized Multi-Agent Search, Mapping & Environmental Sensing',
    introducedYear: 2025,
    status: 'Prototype',
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
    academicNotes: {
      aerodynamicProfile: 'Ducted-fan shrouded quadrotor for close-proximity collision resilience',
      controlArchitecture: 'Decentralized Boids/Consensus flocking algorithm over Ultra-Wideband (UWB) relative ranging mesh',
      sensorSuite: ['3D Solid-State LiDAR', 'UWB Inter-Drone Transceiver', 'Stereo Depth Cameras'],
      learningTakeaways: ['Key academic reference for decentralized consensus algorithms, Voronoi area partitioning, and SLAM map merging']
    },
    description: 'An academic and industrial swarm robotics platform that coordinates dozens of UAVs using decentralized mesh networking and collaborative 3D SLAM.'
  }
];

async function ensureSeedData() {
  const count = await Drone.countDocuments();
  if (count === 0) {
    console.log('[Seed] Populating initial drone encyclopedia...');
    for (const drone of INITIAL_DRONES) {
      await Drone.create(drone);
    }
    console.log(`[Seed] Inserted ${INITIAL_DRONES.length} baseline drones.`);
  }
}

module.exports = { ensureSeedData, INITIAL_DRONES };
