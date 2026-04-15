const Drone = require('../models/Drone');
const Country = require('../models/Country');
const CounterSystem = require('../models/CounterSystem');

const EFFECTIVENESS_SCORES = {
  High: 40,
  Medium: 25,
  Low: 10,
};

const ATTACK_TYPE_WEIGHTS = {
  Swarm: 3.2,
  Tactical: 2.1,
  MALE: 2.6,
  HALE: 3,
  Loitering: 2.4,
  Nano: 1.5,
};

function handleServerError(res, error) {
  res.status(500).json({ error: error.message });
}

function buildCrudHandlers(Model, entityName) {
  const displayName = entityName.toLowerCase();

  return {
    async create(req, res) {
      try {
        const document = await Model.create(req.body);
        res.status(201).json(document);
      } catch (error) {
        res.status(400).json({ error: `Failed to create ${displayName}.`, details: error.message });
      }
    },
    async update(req, res) {
      try {
        const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true,
        });

        if (!document) {
          return res.status(404).json({ error: `${entityName} not found.` });
        }

        res.json(document);
      } catch (error) {
        res.status(400).json({ error: `Failed to update ${displayName}.`, details: error.message });
      }
    },
    async remove(req, res) {
      try {
        const document = await Model.findByIdAndDelete(req.params.id);

        if (!document) {
          return res.status(404).json({ error: `${entityName} not found.` });
        }

        res.json({ message: `${entityName} deleted successfully.` });
      } catch (error) {
        handleServerError(res, error);
      }
    },
  };
}

function buildThreatLevel(successProbability) {
  if (successProbability >= 65) {
    return 'LOW';
  }

  if (successProbability >= 35) {
    return 'MEDIUM';
  }

  return 'HIGH';
}

function buildThreatLevelFromScore(threatScore) {
  if (threatScore >= 75) {
    return 'HIGH';
  }

  if (threatScore >= 40) {
    return 'MEDIUM';
  }

  return 'LOW';
}

exports.getCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ drone_count: -1, name: 1 });
    res.json(countries);
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.getDrones = async (req, res) => {
  try {
    const filters = {};

    if (req.query.type) {
      filters.type = req.query.type;
    }

    if (req.query.country) {
      filters.country = req.query.country;
    }

    const drones = await Drone.find(filters).sort({ name: 1 });
    res.json(drones);
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.getCounterSystems = async (req, res) => {
  try {
    const systems = await CounterSystem.find().sort({ name: 1 });
    res.json(systems);
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.simulateWhatIf = async (req, res) => {
  try {
    const { country, attack_type } = req.body;

    if (!country || !attack_type) {
      return res.status(400).json({ error: 'country and attack_type are required.' });
    }

    const selectedCountry = await Country.findOne({
      $or: [{ code: country }, { name: country }],
    });
    const growthRate = selectedCountry?.growth_rate || 0;
    const attackWeight = ATTACK_TYPE_WEIGHTS[attack_type] || 1.5;
    const threatScore = Number((growthRate * attackWeight).toFixed(1));

    const availableCounters = await CounterSystem.find({
      effective_against: attack_type,
    }).sort({ name: 1 });

    const rankedCounters = [...availableCounters].sort(
      (left, right) =>
        (EFFECTIVENESS_SCORES[right.effectiveness] || 0) -
        (EFFECTIVENESS_SCORES[left.effectiveness] || 0)
    );

    const successProbability = Math.min(
      rankedCounters.reduce(
        (total, counterSystem) => total + (EFFECTIVENESS_SCORES[counterSystem.effectiveness] || 0),
        0
      ),
      90
    );
    const adjustedSuccessProbability = Math.max(
      Math.min(Math.round(successProbability - threatScore / 8), 90),
      rankedCounters.length ? 10 : 0
    );
    const threatLevel = buildThreatLevelFromScore(threatScore);

    const countryAnalysis = selectedCountry
      ? `${selectedCountry.name} specializes in ${selectedCountry.specialization} and fields approximately ${selectedCountry.drone_count.toLocaleString()} drones.`
      : 'Country-specific force posture was unavailable, so the engine used the baseline threat model.';
    const reasoning = selectedCountry
      ? `${selectedCountry.name} has a ${growthRate}% growth rate and ${attack_type} carries a ${attackWeight} threat weight, creating a threat score of ${threatScore}.`
      : `Threat reasoning used the default attack weight of ${attackWeight} because country growth data was unavailable.`;

    if (rankedCounters.length === 0) {
      return res.json({
        threat_level: threatLevel,
        threat_score: threatScore,
        recommended_counters: [],
        success_probability: '0%',
        reasoning,
        analysis: `${countryAnalysis} No counter systems in the current database are mapped to ${attack_type} threats yet.`,
      });
    }

    res.json({
      threat_level: threatLevel,
      threat_score: threatScore,
      recommended_counters: rankedCounters
        .slice(0, 3)
        .map((counterSystem) => `${counterSystem.name} (${counterSystem.type})`),
      success_probability: `${adjustedSuccessProbability}%`,
      reasoning,
      defense_confidence: buildThreatLevel(successProbability),
      analysis: `${countryAnalysis} These counters are recommended because ${rankedCounters
        .slice(0, 3)
        .map((counterSystem) => counterSystem.description)
        .join(' ')} This model lowered defensive confidence against a ${threatLevel.toLowerCase()} threat score.`,
    });
  } catch (error) {
    handleServerError(res, error);
  }
};

const droneCrud = buildCrudHandlers(Drone, 'Drone');
const countryCrud = buildCrudHandlers(Country, 'Country');
const counterCrud = buildCrudHandlers(CounterSystem, 'Counter system');

exports.createDrone = droneCrud.create;
exports.updateDrone = droneCrud.update;
exports.deleteDrone = droneCrud.remove;

exports.createCountry = countryCrud.create;
exports.updateCountry = countryCrud.update;
exports.deleteCountry = countryCrud.remove;

exports.createCounterSystem = counterCrud.create;
exports.updateCounterSystem = counterCrud.update;
exports.deleteCounterSystem = counterCrud.remove;
